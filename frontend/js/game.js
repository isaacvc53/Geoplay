// js/game.js
// Generic engine for the "guess the region" game.
//
// Everything country-specific comes from window.GEOTARIA_COUNTRY.
// The geometry is loaded from country.geoFile.
// The initial map view is computed automatically from the real
// bounding box of the regions.
// Zoom and panning are constrained symmetrically so the map can
// never be dragged too far off to one side.

(function () {
  const country = window.GEOTARIA_COUNTRY;

  if (!country) {
    console.error(
      "window.GEOTARIA_COUNTRY is missing: pages/country.html must load data/countries/<country>.js before js/game.js"
    );
    return;
  }

  const svg = d3.select("#map");

  const guessEl = document.getElementById("guess");
  const countEl = document.getElementById("count");
  const totalEl = document.getElementById("total");
  const timerEl = document.getElementById("timer");
  const feedbackEl = document.getElementById("feedback");
  const pauseBtn = document.getElementById("pause");
  const toastEl = document.getElementById("toast");
  const loadingOverlay = document.getElementById("loading-overlay");
  const submitBtn = document.getElementById("submit");
  const foundListWrap = document.getElementById("found-list-wrap");
  const foundList = document.getElementById("found-list");
  const foundScrim = document.getElementById("found-scrim");
  const foundDrawerClose = document.getElementById("found-drawer-close");
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const resetViewBtn = document.getElementById("reset-view");
  const missingBtn = document.getElementById("missing");
  const giveUpBtn = document.getElementById("give-up");
  const resetBtn = document.getElementById("reset");
  const backBtn = document.getElementById("back-to-world");

  const QUIZ_SECONDS = country.quizSeconds || 8 * 60;
  const LOW_TIME_THRESHOLD = 30; // seconds left to show the "running out" warning

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ZOOM_TRANSITION_MS = prefersReducedMotion ? 0 : 180;
  const RESET_TRANSITION_MS = prefersReducedMotion ? 0 : 220;

  let regions = country.regions || [];
  let featureByRegion = new Map();
  let solved = new Set();
  let localMode = false;
  let secondsLeft = QUIZ_SECONDS;
  let timerHandle = null;
  let paused = false;
  let quizEnded = false;
  let tooltipEl = null;
  let zoomBehavior = null;
  let initialViewBox = null;
  let previousBest = null;
  let toastTimeoutHandle = null;


  // ============================================================
  // TIME
  // ============================================================

  function fmtTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }


  // ============================================================
  // FEEDBACK
  // ============================================================

  function setFeedback(msg, type = "") {
    feedbackEl.textContent = msg;
    feedbackEl.className = "feedback " + type;
  }


  // ============================================================
  // TOAST
  // ============================================================

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");

    if (toastTimeoutHandle) clearTimeout(toastTimeoutHandle);
    toastTimeoutHandle = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 1200);
  }


  // ============================================================
  // PERSONAL RECORD TOAST
  // ============================================================
  // A louder, longer-lived variant of showToast(), used to celebrate a
  // better score or a better time for this country.

  function showRecordToast(msg) {
    toastEl.textContent = "🏆 " + msg;
    toastEl.style.borderColor = "#e0bd7d";
    toastEl.style.boxShadow = "0 0 18px rgba(224,189,125,.55)";
    toastEl.classList.add("show");

    if (toastTimeoutHandle) clearTimeout(toastTimeoutHandle);
    toastTimeoutHandle = setTimeout(() => {
      toastEl.classList.remove("show");
      toastEl.style.borderColor = "";
      toastEl.style.boxShadow = "";
    }, 2600);
  }


  // ============================================================
  // COUNTER
  // ============================================================

  function updateCount() {
    countEl.textContent = solved.size;

    if (totalEl) {
      totalEl.textContent = Number.isFinite(Number(country.total))
        ? Number(country.total)
        : regions.length;
    }

    if (solved.size === regions.length && regions.length) {
      endQuiz(country.completeMessage || "Completed!", "ok");
    }
  }


  // ============================================================
  // REVEAL MISSING REGIONS
  // ============================================================

  function revealMissingOnMap() {
    regions.forEach((r) => {
      const el = featureByRegion.get(r.id);
      if (el) el.classed("revealed-missing", !solved.has(r.id));
    });

    const hintEl = document.querySelector(".hint");
    if (hintEl) {
      hintEl.textContent =
        country.hintTextRevealed || "Hover over a region to see its name";
    }
  }


  // ============================================================
  // TIMER
  // ============================================================

  function startTimer() {
    if (timerHandle || quizEnded) return;

    timerHandle = setInterval(() => {
      if (paused) return;

      secondsLeft--;
      timerEl.textContent = fmtTime(secondsLeft);
      timerEl.classList.toggle("low", secondsLeft > 0 && secondsLeft <= LOW_TIME_THRESHOLD);

      if (secondsLeft <= 0) {
        secondsLeft = 0;
        timerEl.textContent = "00:00";
        endQuiz(country.timeUpMessage || "Time's up.", "no");
      }
    }, 1000);
  }


  // ============================================================
  // END OF QUIZ
  // ============================================================

  function endQuiz(message, type) {
    quizEnded = true;

    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;

    guessEl.disabled = true;
    if (submitBtn) submitBtn.disabled = true;

    setFeedback(message, type);
    revealMissingOnMap();
    maybeCelebrateRecord();
    saveGameSession();
  }


  // ============================================================
  // PREVIOUS BEST RESULT (so we can celebrate new records)
  // ============================================================

  async function loadPreviousBest() {
    previousBest = null;

    if (
      typeof api === "undefined" ||
      !api.isLoggedIn ||
      !api.isLoggedIn() ||
      !country.id
    ) {
      return;
    }

    try {
      const progressData = await api.getCountryProgress(country.id);
      previousBest = progressData.best_score || null;
    } catch (err) {
      console.warn("Could not load the previous best result for this country", err);
    }
  }


  // ============================================================
  // CELEBRATE A PERSONAL RECORD
  // ============================================================
  // The result of the game that just ended is compared against
  // previousBest (loaded when the game started, BEFORE playing, so it's
  // never compared against itself). Only relevant if the player is
  // logged in and the game counts towards the backend (same conditions
  // as saveGameSession).

  function maybeCelebrateRecord() {
    if (
      typeof api === "undefined" ||
      !api.isLoggedIn ||
      !api.isLoggedIn() ||
      !country.id ||
      localMode ||
      !regions.length ||
      !solved.size
    ) {
      return;
    }

    const total = regions.length;
    const pctNow = Math.round((solved.size / total) * 1000) / 10;
    const elapsedNow = QUIZ_SECONDS - secondsLeft;

    if (!previousBest) {
      showRecordToast(
        country.firstCompletionMessage || "First expedition logged for this country!"
      );
      return;
    }

    const prevPct = previousBest.percentage;
    const prevTime = previousBest.time_seconds;

    if (pctNow > prevPct) {
      const gain = Math.round((pctNow - prevPct) * 10) / 10;
      showRecordToast(
        (country.newBestScoreMessage || "New best score! +{gain} pts").replace(
          "{gain}",
          gain
        )
      );
      return;
    }

    if (pctNow === prevPct && prevTime != null && elapsedNow < prevTime) {
      const saved = prevTime - elapsedNow;
      showRecordToast(
        (country.newBestTimeMessage || "New best time! -{saved}s").replace(
          "{saved}",
          saved
        )
      );
    }
  }


  // ============================================================
  // SAVE GAME SESSION (progress)
  // ============================================================

  function saveGameSession() {
    console.log("saveGameSession: checking conditions...", {
      apiDefined: typeof api !== "undefined",
      isLoggedIn: typeof api !== "undefined" && api.isLoggedIn && api.isLoggedIn(),
      countryId: country.id,
      localMode: localMode,
      regionsLength: regions.length,
    });

    if (
      typeof api === "undefined" ||
      !api.isLoggedIn ||
      !api.isLoggedIn() ||
      !country.id ||
      localMode ||
      !regions.length
    ) {
      console.warn("saveGameSession: cancelled by one of the conditions above");
      return;
    }

    const elapsed = QUIZ_SECONDS - secondsLeft;

    // Only regions that matched a real backend region_id (loadRegions()
    // assigns this) are sent. Ones that didn't match don't have a valid
    // id for the `regions` table and would break the save.
    const answers = regions
      .filter((r) => r.region_id != null)
      .map((r) => ({
        region_id: r.region_id,
        correct: solved.has(r.id),
      }));

    if (!answers.length) {
      console.warn("No regions have a backend region_id; the session was not saved");
      return;
    }

    api.saveGameSession(country.id, elapsed, answers).catch((err) => {
      console.error("Could not save the game session progress", err);
    });
  }


  // ============================================================
  // RESET QUIZ
  // ============================================================

  function resetQuiz() {
    solved.clear();

    secondsLeft = QUIZ_SECONDS;
    paused = false;
    quizEnded = false;

    timerEl.textContent = fmtTime(QUIZ_SECONDS);
    timerEl.classList.remove("paused", "low");

    pauseBtn.textContent = country.pauseLabel || "Pause";

    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;

    guessEl.disabled = false;
    if (submitBtn) submitBtn.disabled = false;

    closeFoundDrawer();
    setFeedback("");

    svg
      .selectAll(".country")
      .classed("found", false)
      .classed("revealed-missing", false);

    const hintEl = document.querySelector(".hint");
    if (hintEl) hintEl.textContent = country.hintText || "";

    hideMapTooltip();
    updateFoundList();
    updateCount();

    guessEl.value = "";
    guessEl.focus();

    resetMapView();
  }


  function startOnFirstInput() {
    startTimer();
  }


  // ============================================================
  // NORMALIZATION
  // ============================================================

  function normalizeSafe(value) {
    if (typeof normalizeText === "function") {
      return normalizeText(value);
    }

    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }


  // ============================================================
  // MATCHING REGIONS TO THE SVG
  // ============================================================

  function buildFeatureIndex() {
    featureByRegion.clear();

    const shapes = Array.from(
      document.querySelectorAll("#map .regions .country")
    );

    const byId = new Map();
    const byName = new Map();

    shapes.forEach((el) => {
      if (el.id && !byId.has(normalizeSafe(el.id))) {
        byId.set(normalizeSafe(el.id), el);
      }

      const titleEl = el.querySelector("title");
      const label = el.getAttribute("title") || (titleEl ? titleEl.textContent : "");

      if (label && !byName.has(normalizeSafe(label))) {
        byName.set(normalizeSafe(label), el);
      }
    });

    regions.forEach((r) => {
      let el =
        document.getElementById("hex-" + r.id) || byId.get(normalizeSafe(r.id));

      if (!el) {
        const candidateNames = [r.id, r.display, ...(r.names || [])];

        for (const candidateName of candidateNames) {
          if (!candidateName) continue;

          const found = byName.get(normalizeSafe(candidateName));

          if (found) {
            el = found;
            break;
          }
        }
      }

      if (el) {
        featureByRegion.set(r.id, d3.select(el));
        el.setAttribute("data-region-id", r.id);
      } else {
        console.warn(`Could not find an SVG shape for "${r.display || r.id}"`);
      }
    });
  }


  // ============================================================
  // VALIDATION
  // ============================================================

  function validateRegions() {
    const shapes = Array.from(
      document.querySelectorAll("#map .regions .country")
    );

    const missingShapes = regions.filter((r) => !featureByRegion.has(r.id));

    const matchedElements = new Set(
      regions
        .map((r) => featureByRegion.get(r.id)?.node())
        .filter(Boolean)
    );

    const unmatchedShapes = shapes.filter((el) => !matchedElements.has(el));

    if (!missingShapes.length && !unmatchedShapes.length) {
      console.log(
        `✅ ${country.slug}: all ${regions.length} regions match the SVG perfectly.`
      );
      return;
    }

    if (missingShapes.length) {
      console.warn(
        `⚠️ ${country.slug}: ${missingShapes.length} region(s) have no matching shape in the SVG:`,
        missingShapes.map((r) => `${r.id} → "${r.display}"`)
      );
    }

    if (unmatchedShapes.length) {
      console.warn(
        `⚠️ ${country.slug}: ${unmatchedShapes.length} SVG shape(s) have no matching region:`,
        unmatchedShapes.map(
          (el) =>
            `id="${el.id}" title="${
              el.getAttribute("title") || el.querySelector("title")?.textContent || ""
            }"`
        )
      );
    }
  }


  // ============================================================
  // TOOLTIP
  // ============================================================

  function showMapTooltip(name, e) {
    ensureMapTooltip();
    tooltipEl.textContent = name || "";
    tooltipEl.style.display = "block";
    moveMapTooltip(e);
  }


  function moveMapTooltip(e) {
    ensureMapTooltip();

    const mapArea = document.getElementById("map-area");
    if (!mapArea) return;

    const rect = mapArea.getBoundingClientRect();
    tooltipEl.style.left = e.clientX - rect.left + 12 + "px";
    tooltipEl.style.top = e.clientY - rect.top - 12 + "px";
  }


  function hideMapTooltip() {
    if (tooltipEl) tooltipEl.style.display = "none";
  }


  function ensureMapTooltip() {
    if (tooltipEl) return;

    tooltipEl = document.createElement("div");

    tooltipEl.style.cssText =
      "position:absolute;pointer-events:none;display:none;z-index:20;background:#0e2233;color:var(--ink);border:1px solid var(--accent);padding:6px 9px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 5px 16px rgba(0,0,0,.2)";

    const mapArea = document.getElementById("map-area");
    if (mapArea) mapArea.appendChild(tooltipEl);
  }


  // ============================================================
  // ACTUAL BOUNDING BOX OF THE REGIONS
  // ============================================================

  function getRegionsBounds() {
    const nodes = Array.from(
      document.querySelectorAll("#map .regions .country")
    );

    if (!nodes.length) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      try {
        const box = node.getBBox();

        if (
          !box ||
          !Number.isFinite(box.x) ||
          !Number.isFinite(box.y) ||
          !Number.isFinite(box.width) ||
          !Number.isFinite(box.height)
        ) {
          return;
        }

        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.width);
        maxY = Math.max(maxY, box.y + box.height);
      } catch (err) {
        console.warn("Could not get the bounding box of a region", err);
      }
    });

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    ) {
      return null;
    }

    const width = maxX - minX;
    const height = maxY - minY;

    if (width <= 0 || height <= 0) return null;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }


  // ============================================================
  // CALCULATE THE FITTED VIEWBOX
  // ============================================================

  function calculateFittedViewBox(bounds, width, height) {
    if (!bounds) return null;

    const containerRatio = width / height;

    // Margin around the territory.
    const padding = 0.08;

    let targetWidth = bounds.width * (1 + padding * 2);
    let targetHeight = bounds.height * (1 + padding * 2);

    const countryRatio = targetWidth / targetHeight;

    // Adjust the box so it has exactly the same aspect ratio as the container.
    if (countryRatio < containerRatio) {
      targetWidth = targetHeight * containerRatio;
    } else {
      targetHeight = targetWidth / containerRatio;
    }

    const x = bounds.centerX - targetWidth / 2;
    const y = bounds.centerY - targetHeight / 2;

    return { x, y, width: targetWidth, height: targetHeight };
  }


  // ============================================================
  // SET UP THE MAP VIEW
  // ============================================================

  function setupMapView() {
    const mapArea = document.getElementById("map-area");

    if (!mapArea) {
      console.error("#map-area does not exist");
      return;
    }

    const width = mapArea.clientWidth || 960;
    const height = mapArea.clientHeight || 620;

    const bounds = getRegionsBounds();

    if (!bounds) {
      console.warn("Could not compute the actual bounding box of the country.");
      return;
    }

    const fitted = calculateFittedViewBox(bounds, width, height);

    if (!fitted) return;


    // ----------------------------------------------------------
    // VIEWBOX
    // ----------------------------------------------------------

    const viewBoxString = [fitted.x, fitted.y, fitted.width, fitted.height].join(" ");

    svg.attr("viewBox", viewBoxString);
    svg.attr("preserveAspectRatio", "xMidYMid meet");
    svg.attr("x", 0);
    svg.attr("y", 0);

    initialViewBox = { ...fitted };


    // ----------------------------------------------------------
    // ZOOM
    // ----------------------------------------------------------
    //
    // extent and translateExtent must share the same coordinate space
    // for the drag clamp to be symmetric. Since the zoom transform is
    // applied to a <g> that lives inside the SVG's own viewBox, both
    // are expressed in viewBox units (matching "fitted") — not the
    // container's CSS pixel size, which is a different coordinate
    // system and was skewing the clamp toward one corner.

    zoomBehavior = d3
      .zoom()
      .scaleExtent([1, 10])
      .extent([
        [fitted.x, fitted.y],
        [fitted.x + fitted.width, fitted.y + fitted.height],
      ])
      .translateExtent([
        [fitted.x, fitted.y],
        [fitted.x + fitted.width, fitted.y + fitted.height],
      ])
      .on("zoom", (e) => {
        svg.select(".regions").attr("transform", e.transform);
      });

    svg.call(zoomBehavior);

    // Initial view.
    svg.call(zoomBehavior.transform, d3.zoomIdentity);


    // ----------------------------------------------------------
    // ZOOM +
    // ----------------------------------------------------------

    if (zoomInBtn) {
      zoomInBtn.onclick = () => {
        svg.transition().duration(ZOOM_TRANSITION_MS).call(zoomBehavior.scaleBy, 1.45);
      };
    }


    // ----------------------------------------------------------
    // ZOOM -
    // ----------------------------------------------------------

    if (zoomOutBtn) {
      zoomOutBtn.onclick = () => {
        svg.transition().duration(ZOOM_TRANSITION_MS).call(zoomBehavior.scaleBy, 1 / 1.45);
      };
    }


    // ----------------------------------------------------------
    // RESET VIEW
    // ----------------------------------------------------------

    if (resetViewBtn) {
      resetViewBtn.onclick = () => {
        resetMapView();
      };
    }
  }


  // ============================================================
  // RESET THE MAP VIEW
  // ============================================================

  function resetMapView() {
    if (!zoomBehavior) return;

    svg
      .transition()
      .duration(RESET_TRANSITION_MS)
      .call(zoomBehavior.transform, d3.zoomIdentity);
  }


  // ============================================================
  // RENDER MAP
  // ============================================================

  function renderMap() {
    buildFeatureIndex();
    validateRegions();

    setupMapView();


    // ----------------------------------------------------------
    // TOOLTIP / HOVER
    // ----------------------------------------------------------

    svg
      .selectAll(".country")

      .on("click", () => {})

      .on("mouseenter", function (e) {
        const id = this.getAttribute("data-region-id");

        if (!id) return;
        if (!quizEnded && !solved.has(id)) return;

        const r = regions.find((x) => x.id === id);

        if (r) showMapTooltip(r.display, e);
      })

      .on("mousemove", function (e) {
        const id = this.getAttribute("data-region-id");

        if (quizEnded || (id && solved.has(id))) {
          moveMapTooltip(e);
        }
      })

      .on("mouseleave", hideMapTooltip);
  }


  // ============================================================
  // REGION SOLVED
  // ============================================================

  function addSolved(region) {
    if (!region || solved.has(region.id)) return;

    solved.add(region.id);

    const el = featureByRegion.get(region.id);

    if (el) {
      el.classed("found", true).classed("revealed-missing", false);
    }

    updateFoundList();
    updateCount();

    showToast("✓ " + (region.display || "Correct"));

    setFeedback(
      (country.correctPrefix || "Correct! ") + (region.display || ""),
      "ok"
    );

    guessEl.value = "";
    guessEl.focus();
  }


  // ============================================================
  // LOAD REGIONS (from the backend)
  // ============================================================

  async function loadRegions() {
    try {
      const data = await api.getRegionsNames(country.slug);

      let matchedCount = 0;

      data.forEach((backendRegion) => {
        const backendKeys = (backendRegion.names || []).map(normalizeSafe);

        const local = regions.find((r) =>
          (r.names || []).some((n) => backendKeys.includes(normalizeSafe(n)))
        );

        if (local) {
          local.region_id = backendRegion.region_id;
          matchedCount++;
        }
      });

      localMode = false;

      setFeedback(`Connected — ${matchedCount} region(s) loaded from the database`);
    } catch (err) {
      console.warn("Backend unavailable or country not seeded, using local mode", err);
      localMode = true;
    }
  }


  // ============================================================
  // CHECK A GUESS
  // ============================================================

  async function submitGuess() {
    if (quizEnded || paused) return;

    const raw = guessEl.value.trim();

    if (!raw) return;

    startOnFirstInput();

    let region = null;

    // Always check locally first (instant, no network): the valid names
    // are already loaded into `regions` from loadRegions(), so there's no
    // need to wait on a backend/DB round trip for every attempt (that
    // used to make the game feel slow, unlike a fully client-side
    // validated quiz).
    region = findLocalGuess(regions, raw);

    // Only ask the backend if the local match found nothing, in case it
    // knows a name/language the local JSON doesn't cover (a safety net,
    // not the common path). This never slows down correct guesses, which
    // are the common case: it only fires once the local check has
    // already failed.
    if (!region && !localMode) {
      try {
        const data = await api.checkRegionName(country.slug, raw);

        if (data.encontrado) {
          region = regions.find((r) => r.region_id === data.region_id) || null;
        }
      } catch (err) {
        localMode = true;
      }
    }

    if (!region) {
      setFeedback(country.notFoundMessage || "Not found or ambiguous name.", "no");
      guessEl.select();
      return;
    }

    if (solved.has(region.id)) {
      setFeedback(country.alreadyFoundMessage || "Already found.");
      guessEl.select();
      return;
    }

    addSolved(region);
  }


  // ============================================================
  // FOUND-REGIONS LIST / DRAWER
  // ============================================================

  function updateFoundList() {
    if (!foundListWrap || !foundList) return;

    const found = regions
      .filter((r) => solved.has(r.id))
      .sort((a, b) => a.display.localeCompare(b.display, country.lang || "en"));

    foundList.innerHTML = found
      .map((r) => `<span class="chip">${r.display}</span>`)
      .join("");
  }


  function openFoundDrawer() {
    if (!foundListWrap) return;

    foundListWrap.classList.add("open");
    if (foundScrim) foundScrim.classList.add("open");
  }


  function closeFoundDrawer() {
    if (!foundListWrap) return;

    foundListWrap.classList.remove("open");
    if (foundScrim) foundScrim.classList.remove("open");
  }


  function toggleFoundList() {
    if (!foundListWrap) return;

    if (!solved.size) {
      setFeedback(country.noneFoundMessage || "You haven't guessed any yet.");
      return;
    }

    updateFoundList();

    if (foundListWrap.classList.contains("open")) {
      closeFoundDrawer();
    } else {
      openFoundDrawer();
    }
  }


  // ============================================================
  // BACK TO WORLD MAP BUTTON
  // ============================================================
  // pages/country.html already ships a real <a id="back-to-world"> link
  // inside the header, laid out in normal document flow, so under normal
  // circumstances there's nothing to do here. This only builds a
  // fallback link — appended to the header, never a floating element
  // that could sit on top of other content — for an older cached copy
  // of the page that doesn't have it yet.

  function setupBackToWorldButton() {
    if (backBtn) return;

    const header = document.querySelector(".game-header") || document.querySelector("header");
    if (!header) return;

    const link = document.createElement("a");
    link.id = "back-to-world";
    link.className = "back-btn";
    link.href = "mapa-mundial.html";
    link.innerHTML = '<span class="arrow" aria-hidden="true">←</span><span>World map</span>';

    header.prepend(link);
  }


  // ============================================================
  // CONTROLS
  // ============================================================

  pauseBtn.onclick = () => {
    if (quizEnded) return;

    paused = !paused;

    timerEl.classList.toggle("paused", paused);

    pauseBtn.textContent = paused
      ? country.resumeLabel || "Resume"
      : country.pauseLabel || "Pause";

    setFeedback(paused ? country.pausedMessage || "Paused." : "");

    if (paused) {
      guessEl.blur();
    } else {
      guessEl.focus();
    }
  };


  if (submitBtn) {
    submitBtn.onclick = submitGuess;
  }


  if (missingBtn) {
    missingBtn.onclick = toggleFoundList;
  }


  if (foundDrawerClose) {
    foundDrawerClose.onclick = closeFoundDrawer;
  }


  if (foundScrim) {
    foundScrim.onclick = closeFoundDrawer;
  }


  if (giveUpBtn) {
    giveUpBtn.onclick = () => {
      if (quizEnded) return;

      endQuiz(
        (country.giveUpMessage || "Quiz finished: {count}/{total}.")
          .replace("{count}", solved.size)
          .replace("{total}", regions.length),
        "no"
      );
    };
  }


  if (resetBtn) {
    resetBtn.onclick = resetQuiz;
  }


  guessEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitGuess();
    }
  });


  // Unlike findLocalGuess() (which also accepts prefixes of 3+ letters
  // when they identify a single region — meant for when the player has
  // finished typing and presses Enter/Check), this variant ONLY accepts
  // the full name. It's what the live check below uses: if it accepted
  // prefixes, typing e.g. "kab" would already mark "Kabul" as solved
  // before the player finished typing it.
  function findExactLocalMatch(regionsList, raw) {
    const q = normalizeSafe(raw);

    if (!q) return null;

    const exact = regionsList.filter((r) =>
      (r.names || []).some((n) => normalizeSafe(n) === q)
    );

    return exact.length === 1 ? exact[0] : null;
  }


  // Instant check while typing: as soon as the text matches EXACTLY the
  // full name of a region, it's marked correct right away, with no need
  // to press Enter or the "Check" button. This doesn't use
  // findLocalGuess()'s partial/prefix matching (that's reserved for
  // manual submission): on every keystroke, partial matching would
  // accept a region as soon as its first 3 letters were typed, before
  // the player finished typing it.
  guessEl.addEventListener("input", () => {
    if (quizEnded || paused) return;

    const raw = guessEl.value.trim();

    if (!raw) return;

    const region = findExactLocalMatch(regions, raw);

    if (region && !solved.has(region.id)) {
      startOnFirstInput();
      addSolved(region);
    }
  });


  // ============================================================
  // LOAD GEOMETRY
  // ============================================================

  async function loadGeometry() {
    // No { cache: "no-store" }: we let the browser use its normal HTTP
    // cache for the SVG. This used to force a full network download on
    // every visit, which was a big part of the wait; now, the second
    // time the same country is loaded, the SVG can come from cache
    // almost instantly.
    const res = await fetch(country.geoFile);

    if (!res.ok) {
      throw new Error("Could not load the geometry: HTTP " + res.status);
    }

    const svgText = await res.text();

    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");

    if (doc.querySelector("parsererror")) {
      throw new Error("The geometry SVG is not valid");
    }

    const sourceSvg = doc.documentElement;

    const regionsGroup = document.querySelector("#map .regions");

    if (!regionsGroup) {
      throw new Error("#map .regions does not exist");
    }

    regionsGroup.innerHTML = "";

    sourceSvg
      .querySelectorAll("path, polygon, polyline, circle, ellipse")
      .forEach((shape) => {
        if (shape.closest("#points, #label_points")) return;

        const imported = document.importNode(shape, true);

        imported.classList.add("country");

        regionsGroup.appendChild(imported);
      });

    svg.attr("preserveAspectRatio", "xMidYMid meet");
  }


  // ============================================================
  // RESPONSIVE
  // ============================================================

  let resizeTimer = null;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      if (!svg.node()) return;

      renderMap();
    }, 150);
  });


  // ============================================================
  // BOOTSTRAP
  // ============================================================

  async function bootstrap() {
    setupBackToWorldButton();

    if (totalEl) {
      totalEl.textContent = Number.isFinite(Number(country.total))
        ? Number(country.total)
        : regions.length;
    }

    try {
      // We only wait for the SVG geometry, which is the only thing
      // renderMap() truly needs to draw the map. loadRegions() and
      // loadPreviousBest() are backend calls (with their own
      // network/DB latency) that are only needed later, once the game
      // ends (saving progress / celebrating a record) — so they run in
      // parallel, in the background, and no longer delay the map from
      // appearing and becoming playable.
      await loadGeometry();

      renderMap();

      updateCount();

      startTimer();

      timerEl.textContent = fmtTime(QUIZ_SECONDS);

      guessEl.disabled = false;

      if (submitBtn) {
        submitBtn.disabled = false;
      }

      if (loadingOverlay) {
        loadingOverlay.classList.add("hidden");
      }

      setFeedback(country.readyMessage || "Map ready.");

      guessEl.focus();

      Promise.all([loadRegions(), loadPreviousBest()]).then(() => {
        if (localMode) {
          showToast(
            country.readyLocalMessage || "Local mode (no connection to the server)."
          );
        }
      });
    } catch (err) {
      console.error(err);

      if (loadingOverlay) {
        loadingOverlay.classList.add("error");

        const loadingText = document.getElementById("loading-text");
        if (loadingText) {
          loadingText.textContent = country.loadErrorMessage || "Could not load the map.";
        }
      }

      setFeedback(
        country.loadErrorMessage || "Could not load the map. Check your connection.",
        "no"
      );
    }
  }


  bootstrap();
})();
