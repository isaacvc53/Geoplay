// js/game.js
// Generic engine for the "guess the region" game.
//
// Todo lo específico del país viene de:
// window.GEOTARIA_COUNTRY
//
// La geometría se carga desde country.geoFile.
//
// La vista inicial del mapa se calcula automáticamente
// usando el bounding box real de las regiones.
//
// El zoom y el desplazamiento están limitados de forma
// simétrica para evitar que el mapa pueda escaparse
// demasiado hacia un lado.

(function () {
  const country = window.GEOTARIA_COUNTRY;

  if (!country) {
    console.error(
      "Falta window.GEOTARIA_COUNTRY: pages/country.html debe cargar data/countries/<pais>.js antes de js/game.js"
    );
    return;
  }

  const svg = d3.select("#map");

  const guessEl =
    document.getElementById("guess");

  const countEl =
    document.getElementById("count");

  const totalEl =
    document.getElementById("total");

  const timerEl =
    document.getElementById("timer");

  const feedbackEl =
    document.getElementById("feedback");

  const pauseBtn =
    document.getElementById("pause");

  const toastEl =
    document.getElementById("toast");

  const loadingOverlay =
    document.getElementById("loading-overlay");

  const submitBtn =
    document.getElementById("submit");

  const foundListWrap =
    document.getElementById("found-list-wrap");

  const foundList =
    document.getElementById("found-list");

  const zoomInBtn =
    document.getElementById("zoom-in");

  const zoomOutBtn =
    document.getElementById("zoom-out");

  const resetViewBtn =
    document.getElementById("reset-view");

  const missingBtn =
    document.getElementById("missing");

  const giveUpBtn =
    document.getElementById("give-up");

  const resetBtn =
    document.getElementById("reset");

  const backBtn =
    document.getElementById("back-to-world");

  const QUIZ_SECONDS =
    country.quizSeconds || 8 * 60;

  let regions =
    country.regions || [];

  let featureByRegion =
    new Map();

  let solved =
    new Set();

  let localMode =
    false;

  let secondsLeft =
    QUIZ_SECONDS;

  let timerHandle =
    null;

  let paused =
    false;

  let quizEnded =
    false;

  let tooltipEl =
    null;

  let zoomBehavior =
    null;

  let initialViewBox =
    null;

  let previousBest =
    null;

  let toastTimeoutHandle =
    null;


  // ============================================================
  // TIEMPO
  // ============================================================

  function fmtTime(sec) {
    const m =
      String(
        Math.floor(sec / 60)
      ).padStart(2, "0");

    const s =
      String(
        sec % 60
      ).padStart(2, "0");

    return `${m}:${s}`;
  }


  // ============================================================
  // FEEDBACK
  // ============================================================

  function setFeedback(
    msg,
    type = ""
  ) {
    feedbackEl.textContent =
      msg;

    feedbackEl.className =
      "feedback " + type;
  }


  // ============================================================
  // TOAST
  // ============================================================

  function showToast(msg) {
    toastEl.textContent =
      msg;

    toastEl.classList.add(
      "show"
    );

    if (toastTimeoutHandle) {
      clearTimeout(
        toastTimeoutHandle
      );
    }

    toastTimeoutHandle =
      setTimeout(() => {
        toastEl.classList.remove(
          "show"
        );
      }, 1200);
  }


  // ============================================================
  // TOAST DE RÉCORD PERSONAL
  // ============================================================
  // Variante más llamativa y con más duración que showToast(), para
  // celebrar una mejor puntuación o un mejor tiempo en este país.

  function showRecordToast(msg) {
    toastEl.textContent =
      "🏆 " + msg;

    toastEl.style.borderColor =
      "#e0bd7d";

    toastEl.style.boxShadow =
      "0 0 18px rgba(224,189,125,.55)";

    toastEl.classList.add(
      "show"
    );

    if (toastTimeoutHandle) {
      clearTimeout(
        toastTimeoutHandle
      );
    }

    toastTimeoutHandle =
      setTimeout(() => {
        toastEl.classList.remove(
          "show"
        );

        toastEl.style.borderColor =
          "";

        toastEl.style.boxShadow =
          "";
      }, 2600);
  }


  // ============================================================
  // CONTADOR
  // ============================================================

  function updateCount() {
    countEl.textContent =
      solved.size;

    if (totalEl) {
      totalEl.textContent =
        Number.isFinite(Number(country.total))
          ? Number(country.total)
          : regions.length;
    }

    if (
      solved.size ===
        regions.length &&
      regions.length
    ) {
      endQuiz(
        country.completeMessage ||
          "Completed!",
        "ok"
      );
    }
  }


  // ============================================================
  // REVELAR REGIONES
  // ============================================================

  function revealMissingOnMap() {
    regions.forEach((r) => {
      const el =
        featureByRegion.get(
          r.id
        );

      if (el) {
        el.classed(
          "revealed-missing",
          !solved.has(r.id)
        );
      }
    });

    const hintEl =
      document.querySelector(
        ".hint"
      );

    if (hintEl) {
      hintEl.textContent =
        country.hintTextRevealed ||
        "Hover to see the names";
    }
  }


  // ============================================================
  // TIMER
  // ============================================================

  function startTimer() {
    if (
      timerHandle ||
      quizEnded
    ) {
      return;
    }

    timerHandle =
      setInterval(() => {
        if (paused) {
          return;
        }

        secondsLeft--;

        timerEl.textContent =
          fmtTime(secondsLeft);

        if (
          secondsLeft <= 0
        ) {
          secondsLeft = 0;

          timerEl.textContent =
            "00:00";

          endQuiz(
            country.timeUpMessage ||
              "Time's up.",
            "no"
          );
        }
      }, 1000);
  }


  // ============================================================
  // FIN DEL QUIZ
  // ============================================================

  function endQuiz(
    message,
    type
  ) {
    quizEnded = true;

    if (timerHandle) {
      clearInterval(
        timerHandle
      );
    }

    timerHandle = null;

    guessEl.disabled = true;

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    setFeedback(
      message,
      type
    );

    revealMissingOnMap();

    maybeCelebrateRecord();

    saveGameSession();
  }


  // ============================================================
  // MEJOR RESULTADO PREVIO (para poder celebrar récords)
  // ============================================================

  async function loadPreviousBest() {
    previousBest =
      null;

    if (
      typeof api === "undefined" ||
      !api.isLoggedIn ||
      !api.isLoggedIn() ||
      !country.id
    ) {
      return;
    }

    try {
      const progreso =
        await api.getCountryProgress(
          country.id
        );

      previousBest =
        progreso.best_score ||
        null;
    } catch (err) {
      console.warn(
        "Could not load the previous best result for this country",
        err
      );
    }
  }


  // ============================================================
  // CELEBRAR RÉCORD PERSONAL
  // ============================================================
  // Se compara el resultado de la partida que acaba de terminar contra
  // previousBest (cargado al empezar la partida, ANTES de jugar, así que
  // nunca se compara contra sí misma). Solo tiene sentido si el usuario ha
  // iniciado sesión y la partida cuenta para el backend (mismas condiciones
  // que saveGameSession).

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

    const total =
      regions.length;

    const pctNow =
      Math.round(
        (solved.size / total) * 1000
      ) / 10;

    const elapsedNow =
      QUIZ_SECONDS - secondsLeft;

    if (!previousBest) {
      showRecordToast(
        country.firstCompletionMessage ||
          "First expedition logged for this country!"
      );

      return;
    }

    const prevPct =
      previousBest.percentage;

    const prevTime =
      previousBest.time_seconds;

    if (pctNow > prevPct) {
      const gain =
        Math.round(
          (pctNow - prevPct) * 10
        ) / 10;

      showRecordToast(
        (
          country.newBestScoreMessage ||
          "New best score! +{gain} pts"
        ).replace(
          "{gain}",
          gain
        )
      );

      return;
    }

    if (
      pctNow === prevPct &&
      prevTime != null &&
      elapsedNow < prevTime
    ) {
      const saved =
        prevTime - elapsedNow;

      showRecordToast(
        (
          country.newBestTimeMessage ||
          "New best time! -{saved}s"
        ).replace(
          "{saved}",
          saved
        )
      );
    }
  }


  // ============================================================
  // GUARDAR PARTIDA (progreso)
  // ============================================================

  function saveGameSession() {
    console.log("saveGameSession: comprobando condiciones...", {
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

    const elapsed =
      QUIZ_SECONDS - secondsLeft;

    // Solo mandamos regiones que se emparejaron con un region_id real
    // del backend (loadRegions se lo asigna). Las que no casaron no
    // tienen un id válido para la tabla `regiones` y romperían el guardado.
    const answers = regions
      .filter((r) => r.region_id != null)
      .map((r) => ({
        region_id: r.region_id,
        correct: solved.has(r.id),
      }));

    if (!answers.length) {
      console.warn(
        "No hay regiones con region_id del backend; no se guarda la partida"
      );
      return;
    }

    api
      .saveGameSession(
        country.id,
        elapsed,
        answers
      )
      .catch((err) => {
        console.error(
          "No se pudo guardar el progreso de la partida",
          err
        );
      });
  }


  // ============================================================
  // RESET DEL QUIZ
  // ============================================================

  function resetQuiz() {
    solved.clear();

    secondsLeft =
      QUIZ_SECONDS;

    paused = false;
    quizEnded = false;

    timerEl.textContent =
      fmtTime(
        QUIZ_SECONDS
      );

    timerEl.classList.remove(
      "paused"
    );

    pauseBtn.textContent =
      country.pauseLabel ||
      "Pausa";

    if (timerHandle) {
      clearInterval(
        timerHandle
      );
    }

    timerHandle = null;

    guessEl.disabled = false;

    if (submitBtn) {
      submitBtn.disabled = false;
    }

    if (foundListWrap) {
      foundListWrap.classList.remove(
        "open"
      );
    }

    setFeedback("");

    svg
      .selectAll(".country")
      .classed(
        "found",
        false
      )
      .classed(
        "revealed-missing",
        false
      );

    const hintEl =
      document.querySelector(
        ".hint"
      );

    if (hintEl) {
      hintEl.textContent =
        country.hintText ||
        "";
    }

    hideMapTooltip();

    updateFoundList();
    updateCount();

    guessEl.value =
      "";

    guessEl.focus();

    resetMapView();
  }


  function startOnFirstInput() {
    startTimer();
  }


  // ============================================================
  // NORMALIZACIÓN
  // ============================================================

  function normalizeSafe(value) {
    if (
      typeof normalizar ===
      "function"
    ) {
      return normalizar(
        value
      );
    }

    return String(
      value ?? ""
    )
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();
  }


  // ============================================================
  // EMPAREJAMIENTO DE REGIONES CON EL SVG
  // ============================================================

  function buildFeatureIndex() {
    featureByRegion.clear();

    const shapes =
      Array.from(
        document.querySelectorAll(
          "#map .regions .country"
        )
      );

    const byId =
      new Map();

    const byName =
      new Map();

    shapes.forEach(
      (el) => {
        if (
          el.id &&
          !byId.has(
            normalizeSafe(
              el.id
            )
          )
        ) {
          byId.set(
            normalizeSafe(
              el.id
            ),
            el
          );
        }

        const titleEl =
          el.querySelector(
            "title"
          );

        const label =
          el.getAttribute(
            "title"
          ) ||
          (
            titleEl
              ? titleEl.textContent
              : ""
          );

        if (
          label &&
          !byName.has(
            normalizeSafe(
              label
            )
          )
        ) {
          byName.set(
            normalizeSafe(
              label
            ),
            el
          );
        }
      }
    );

    regions.forEach(
      (r) => {
        let el =
          document.getElementById(
            "hex-" + r.id
          ) ||
          byId.get(
            normalizeSafe(
              r.id
            )
          );

        if (!el) {
          const candidatos = [
            r.id,
            r.display,
            ...(r.names || [])
          ];

          for (
            const nombre
            of candidatos
          ) {
            if (!nombre) {
              continue;
            }

            const found =
              byName.get(
                normalizeSafe(
                  nombre
                )
              );

            if (found) {
              el = found;
              break;
            }
          }
        }

        if (el) {
          featureByRegion.set(
            r.id,
            d3.select(el)
          );

          el.setAttribute(
            "data-region-id",
            r.id
          );
        } else {
          console.warn(
            `No se encontró la forma del SVG para "${r.display || r.id}"`
          );
        }
      }
    );
  }


  // ============================================================
  // VALIDACIÓN
  // ============================================================

  function validateRegions() {
    const shapes =
      Array.from(
        document.querySelectorAll(
          "#map .regions .country"
        )
      );

    const sinForma =
      regions.filter(
        (r) =>
          !featureByRegion.has(
            r.id
          )
      );

    const elementosEmparejados =
      new Set(
        regions
          .map(
            (r) =>
              featureByRegion
                .get(r.id)
                ?.node()
          )
          .filter(Boolean)
      );

    const sobrantesEnSvg =
      shapes.filter(
        (el) =>
          !elementosEmparejados.has(
            el
          )
      );

    if (
      !sinForma.length &&
      !sobrantesEnSvg.length
    ) {
      console.log(
        `✅ ${country.slug}: las ${regions.length} regiones casan perfectamente con el SVG.`
      );

      return;
    }

    if (sinForma.length) {
      console.warn(
        `⚠️ ${country.slug}: ${sinForma.length} región(es) sin forma en el SVG:`,
        sinForma.map(
          (r) =>
            `${r.id} → "${r.display}"`
        )
      );
    }

    if (
      sobrantesEnSvg.length
    ) {
      console.warn(
        `⚠️ ${country.slug}: ${sobrantesEnSvg.length} forma(s) del SVG sin ninguna región asociada:`,
        sobrantesEnSvg.map(
          (el) =>
            `id="${el.id}" title="${
              el.getAttribute(
                "title"
              ) ||
              el.querySelector(
                "title"
              )?.textContent ||
              ""
            }"`
        )
      );
    }
  }


  // ============================================================
  // TOOLTIP
  // ============================================================

  function showMapTooltip(
    name,
    e
  ) {
    ensureMapTooltip();

    tooltipEl.textContent =
      name || "";

    tooltipEl.style.display =
      "block";

    moveMapTooltip(e);
  }


  function moveMapTooltip(e) {
    ensureMapTooltip();

    const mapArea =
      document.getElementById(
        "map-area"
      );

    if (!mapArea) {
      return;
    }

    const rect =
      mapArea.getBoundingClientRect();

    tooltipEl.style.left =
      e.clientX -
      rect.left +
      12 +
      "px";

    tooltipEl.style.top =
      e.clientY -
      rect.top -
      12 +
      "px";
  }


  function hideMapTooltip() {
    if (tooltipEl) {
      tooltipEl.style.display =
        "none";
    }
  }


  function ensureMapTooltip() {
    if (tooltipEl) {
      return;
    }

    tooltipEl =
      document.createElement(
        "div"
      );

    tooltipEl.style.cssText =
      "position:absolute;pointer-events:none;display:none;z-index:20;background:#0e2233;color:var(--ink);border:1px solid var(--accent);padding:6px 9px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 5px 16px rgba(0,0,0,.2)";

    const mapArea =
      document.getElementById(
        "map-area"
      );

    if (mapArea) {
      mapArea.appendChild(
        tooltipEl
      );
    }
  }


  // ============================================================
  // BOUNDING BOX REAL
  // ============================================================

  function getRegionsBounds() {
    const nodes =
      Array.from(
        document.querySelectorAll(
          "#map .regions .country"
        )
      );

    if (!nodes.length) {
      return null;
    }

    let minX =
      Infinity;

    let minY =
      Infinity;

    let maxX =
      -Infinity;

    let maxY =
      -Infinity;

    nodes.forEach(
      (node) => {
        try {
          const box =
            node.getBBox();

          if (
            !box ||
            !Number.isFinite(
              box.x
            ) ||
            !Number.isFinite(
              box.y
            ) ||
            !Number.isFinite(
              box.width
            ) ||
            !Number.isFinite(
              box.height
            )
          ) {
            return;
          }

          minX =
            Math.min(
              minX,
              box.x
            );

          minY =
            Math.min(
              minY,
              box.y
            );

          maxX =
            Math.max(
              maxX,
              box.x +
                box.width
            );

          maxY =
            Math.max(
              maxY,
              box.y +
                box.height
            );
        } catch (err) {
          console.warn(
            "Could not get the bounding box of a region.",
            err
          );
        }
      }
    );

    if (
      !Number.isFinite(
        minX
      ) ||
      !Number.isFinite(
        minY
      ) ||
      !Number.isFinite(
        maxX
      ) ||
      !Number.isFinite(
        maxY
      )
    ) {
      return null;
    }

    const width =
      maxX - minX;

    const height =
      maxY - minY;

    if (
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      centerX:
        (minX + maxX) / 2,
      centerY:
        (minY + maxY) / 2
    };
  }


  // ============================================================
  // CALCULAR VIEWBOX AJUSTADO
  // ============================================================

  function calculateFittedViewBox(
    bounds,
    width,
    height
  ) {
    if (!bounds) {
      return null;
    }

    const containerRatio =
      width / height;

    // Margen alrededor del territorio.
    const padding = 0.08;

    let targetWidth =
      bounds.width *
      (1 + padding * 2);

    let targetHeight =
      bounds.height *
      (1 + padding * 2);

    const countryRatio =
      targetWidth /
      targetHeight;

    // Ajustamos la caja para que tenga exactamente
    // la misma proporción que el contenedor.
    if (
      countryRatio <
      containerRatio
    ) {
      targetWidth =
        targetHeight *
        containerRatio;
    } else {
      targetHeight =
        targetWidth /
        containerRatio;
    }

    const x =
      bounds.centerX -
      targetWidth / 2;

    const y =
      bounds.centerY -
      targetHeight / 2;

    return {
      x,
      y,
      width: targetWidth,
      height: targetHeight
    };
  }


  // ============================================================
  // CONFIGURAR MAPA
  // ============================================================

  function setupMapView() {
    const mapArea =
      document.getElementById(
        "map-area"
      );

    if (!mapArea) {
      console.error(
        "No existe #map-area"
      );

      return;
    }

    const width =
      mapArea.clientWidth ||
      960;

    const height =
      mapArea.clientHeight ||
      620;

    const bounds =
      getRegionsBounds();

    if (!bounds) {
      console.warn(
        "Could not compute the actual bounding box of the country."
      );

      return;
    }

    const fitted =
      calculateFittedViewBox(
        bounds,
        width,
        height
      );

    if (!fitted) {
      return;
    }


    // ----------------------------------------------------------
    // VIEWBOX
    // ----------------------------------------------------------

    const viewBoxString =
      [
        fitted.x,
        fitted.y,
        fitted.width,
        fitted.height
      ].join(" ");

    svg.attr(
      "viewBox",
      viewBoxString
    );

    svg.attr(
      "preserveAspectRatio",
      "xMidYMid meet"
    );

    svg.attr(
      "x",
      0
    );

    svg.attr(
      "y",
      0
    );

    initialViewBox = {
      ...fitted
    };


    // ----------------------------------------------------------
    // ZOOM
    // ----------------------------------------------------------
    //
    // translateExtent coincide exactamente con el viewBox.
    //
    // Esto hace que el movimiento sea simétrico.
    //

    zoomBehavior =
      d3.zoom()
        .scaleExtent([
          1,
          10
        ])

        .extent([
          [0, 0],
          [width, height]
        ])

        .translateExtent([
          [
            fitted.x,
            fitted.y
          ],
          [
            fitted.x +
              fitted.width,
            fitted.y +
              fitted.height
          ]
        ])

        .on(
          "zoom",
          (e) => {
            svg
              .select(
                ".regions"
              )
              .attr(
                "transform",
                e.transform
              );
          }
        );


    svg.call(
      zoomBehavior
    );


    // Vista inicial.
    svg.call(
      zoomBehavior.transform,
      d3.zoomIdentity
    );


    // ----------------------------------------------------------
    // ZOOM +
    // ----------------------------------------------------------

    if (zoomInBtn) {
      zoomInBtn.onclick =
        () => {
          svg
            .transition()
            .duration(180)
            .call(
              zoomBehavior.scaleBy,
              1.45
            );
        };
    }


    // ----------------------------------------------------------
    // ZOOM -
    // ----------------------------------------------------------

    if (zoomOutBtn) {
      zoomOutBtn.onclick =
        () => {
          svg
            .transition()
            .duration(180)
            .call(
              zoomBehavior.scaleBy,
              1 / 1.45
            );
        };
    }


    // ----------------------------------------------------------
    // RESET VIEW
    // ----------------------------------------------------------

    if (resetViewBtn) {
      resetViewBtn.onclick =
        () => {
          resetMapView();
        };
    }
  }


  // ============================================================
  // RESET MAPA
  // ============================================================

  function resetMapView() {
    if (!zoomBehavior) {
      return;
    }

    svg
      .transition()
      .duration(220)
      .call(
        zoomBehavior.transform,
        d3.zoomIdentity
      );
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
      .selectAll(
        ".country"
      )

      .on(
        "click",
        () => {}
      )

      .on(
        "mouseenter",
        function (e) {
          const id =
            this.getAttribute(
              "data-region-id"
            );

          if (!id) {
            return;
          }

          if (
            !quizEnded &&
            !solved.has(id)
          ) {
            return;
          }

          const r =
            regions.find(
              (x) =>
                x.id === id
            );

          if (r) {
            showMapTooltip(
              r.display,
              e
            );
          }
        }
      )

      .on(
        "mousemove",
        function (e) {
          const id =
            this.getAttribute(
              "data-region-id"
            );

          if (
            quizEnded ||
            (
              id &&
              solved.has(id)
            )
          ) {
            moveMapTooltip(e);
          }
        }
      )

      .on(
        "mouseleave",
        hideMapTooltip
      );
  }

  // ============================================================
  // REGIÓN ACERTADA
  // ============================================================

  function addSolved(region) {
    if (
      !region ||
      solved.has(
        region.id
      )
    ) {
      return;
    }

    solved.add(
      region.id
    );

    const el =
      featureByRegion.get(
        region.id
      );

    if (el) {
      el
        .classed(
          "found",
          true
        )
        .classed(
          "revealed-missing",
          false
        );
    }

    updateFoundList();
    updateCount();

    showToast(
      "✓ " +
        (
          region.display ||
          "Correcto"
        )
    );

    setFeedback(
      (
        country.correctPrefix ||
        "Correct! "
      ) +
        (
          region.display ||
          ""
        ),
      "ok"
    );

    guessEl.value =
      "";

    guessEl.focus();
  }


  // ============================================================
  // CARGAR REGIONES
  // ============================================================

  async function loadRegions() {
    try {
      const data =
        await api.getRegionsNames(
          country.slug
        );

      let emparejadas =
        0;

      data.forEach(
        (backendRegion) => {
          const backendKeys =
            (
              backendRegion.names ||
              []
            ).map(
              normalizeSafe
            );

          const local =
            regions.find(
              (r) =>
                (
                  r.names ||
                  []
                ).some(
                  (n) =>
                    backendKeys.includes(
                      normalizeSafe(
                        n
                      )
                    )
                )
            );

          if (local) {
            local.region_id =
              backendRegion.region_id;

            emparejadas++;
          }
        }
      );

      localMode = false;

      setFeedback(
        `Conectado — ${emparejadas} región(es) cargada(s) desde la base de datos`
      );
    } catch (err) {
      console.warn(
        "Backend unavailable or country not seeded, using local mode",
        err
      );

      localMode = true;
    }
  }


  // ============================================================
  // COMPROBAR RESPUESTA
  // ============================================================

  async function submitGuess() {
    if (
      quizEnded ||
      paused
    ) {
      return;
    }

    const raw =
      guessEl.value.trim();

    if (!raw) {
      return;
    }

    startOnFirstInput();

    let region =
      null;

    // Comprobamos SIEMPRE en local primero (instantáneo, sin red): los
    // nombres válidos ya están cargados en `regions` desde loadRegions(),
    // así que no hay que esperar a un roundtrip contra el backend/Neon en
    // cada intento (eso era lo que hacía la partida sentirse lenta, a
    // diferencia de JetPunk, que valida 100% en el cliente).
    region =
      findLocalGuess(
        regions,
        raw
      );

    // Solo si el local NO encuentra nada, preguntamos al backend por si
    // conoce un nombre/idioma que el JSON local no contempla (red de
    // seguridad, no el camino habitual). No ralentiza los aciertos, que
    // son el caso común: solo se dispara cuando el local ya ha fallado.
    if (!region && !localMode) {
      try {
        const data =
          await api.checkRegionName(
            country.slug,
            raw
          );

        if (
          data.encontrado
        ) {
          region =
            regions.find(
              (r) =>
                r.region_id ===
                data.region_id
            ) || null;
        }
      } catch (err) {
        localMode = true;
      }
    }

    if (!region) {
      setFeedback(
        country.notFoundMessage ||
          "No encontrado o nombre ambiguo.",
        "no"
      );

      guessEl.select();

      return;
    }

    if (
      solved.has(
        region.id
      )
    ) {
      setFeedback(
        country.alreadyFoundMessage ||
          "Already found."
      );

      guessEl.select();

      return;
    }

    addSolved(
      region
    );
  }


  // ============================================================
  // LISTA DE REGIONES
  // ============================================================

  function updateFoundList() {
    if (
      !foundListWrap ||
      !foundList
    ) {
      return;
    }

    const found =
      regions
        .filter(
          (r) =>
            solved.has(
              r.id
            )
        )
        .sort(
          (a, b) =>
            a.display.localeCompare(
              b.display,
              country.lang ||
                "es"
            )
        );

    foundList.innerHTML =
      found
        .map(
          (r) =>
            `<span class="chip">${r.display}</span>`
        )
        .join("");
  }


  function toggleFoundList() {
    if (!foundListWrap) {
      return;
    }

    if (!solved.size) {
      setFeedback(
        country.noneFoundMessage ||
          "You haven't got any right yet."
      );

      return;
    }

    updateFoundList();

    foundListWrap.classList.toggle(
      "open"
    );
  }


  // ============================================================
  // VOLVER AL MAPA MUNDIAL
  // ============================================================

  function setupBackToWorldButton() {
    let button =
      document.getElementById(
        "back-to-world"
      );

    if (!button) {
      button =
        document.createElement(
          "button"
        );

      button.id =
        "back-to-world";

      button.type =
        "button";

      button.textContent =
        "← Volver al mapa mundial";

      button.style.cssText =
        [
          "position:fixed",
          "top:16px",
          "left:16px",
          "z-index:1000",
          "padding:9px 14px",
          "border:1px solid var(--accent, #7dd3fc)",
          "border-radius:8px",
          "background:var(--panel, #0e2233)",
          "color:var(--ink, #fff)",
          "font:inherit",
          "font-weight:600",
          "cursor:pointer",
          "box-shadow:0 4px 12px rgba(0,0,0,.18)"
        ].join(";");

      document.body.appendChild(
        button
      );
    }

    button.onclick =
      () => {
        window.location.href =
          "mapa-mundial.html";
      };
  }


  // ============================================================
  // CONTROLES
  // ============================================================

  pauseBtn.onclick =
    () => {
      if (quizEnded) {
        return;
      }

      paused =
        !paused;

      timerEl.classList.toggle(
        "paused",
        paused
      );

      pauseBtn.textContent =
        paused
          ? country.resumeLabel ||
            "Reanudar"
          : country.pauseLabel ||
            "Pausa";

      setFeedback(
        paused
          ? country.pausedMessage ||
            "Pausado."
          : ""
      );

      if (paused) {
        guessEl.blur();
      } else {
        guessEl.focus();
      }
    };


  if (submitBtn) {
    submitBtn.onclick =
      submitGuess;
  }


  if (missingBtn) {
    missingBtn.onclick =
      toggleFoundList;
  }


  if (giveUpBtn) {
    giveUpBtn.onclick =
      () => {
        if (quizEnded) {
          return;
        }

        endQuiz(
          (
            country.giveUpMessage ||
            "Quiz terminado: {count}/{total}."
          )
            .replace(
              "{count}",
              solved.size
            )
            .replace(
              "{total}",
              regions.length
            ),
          "no"
        );
      };
  }


  if (resetBtn) {
    resetBtn.onclick =
      resetQuiz;
  }


  guessEl.addEventListener(
    "keydown",
    (e) => {
      if (
        e.key ===
        "Enter"
      ) {
        e.preventDefault();

        submitGuess();
      }
    }
  );


  // Comprobación instantánea mientras se escribe: usa el mismo matching
  // local (sin red) que submitGuess(), así que en cuanto el texto
  // identifica una única región sin ambigüedad, se acierta al momento,
  // sin necesidad de pulsar Enter ni el botón "Comprobar". El fallback al
  // backend (para nombres que el JSON local no contempla) se sigue
  // haciendo solo al enviar de verdad, para no disparar una petición de
  // red en cada pulsación.
  guessEl.addEventListener(
    "input",
    () => {
      if (
        quizEnded ||
        paused
      ) {
        return;
      }

      const raw =
        guessEl.value.trim();

      if (!raw) {
        return;
      }

      const region =
        findLocalGuess(
          regions,
          raw
        );

      if (
        region &&
        !solved.has(
          region.id
        )
      ) {
        startOnFirstInput();

        addSolved(
          region
        );
      }
    }
  );


  // ============================================================
  // CARGAR GEOMETRÍA
  // ============================================================

  async function loadGeometry() {
    // Sin { cache: "no-store" }: dejamos que el navegador use su caché
    // HTTP normal para el SVG. Antes se forzaba una descarga completa por
    // red en cada visita, que era buena parte de los "segundos" de espera;
    // así, la segunda vez que se carga el mismo país, el SVG puede salir
    // de caché casi al instante.
    const res =
      await fetch(
        country.geoFile
      );

    if (!res.ok) {
      throw new Error(
        "Could not load the geometry: HTTP " +
          res.status
      );
    }

    const svgText =
      await res.text();

    const doc =
      new DOMParser().parseFromString(
        svgText,
        "image/svg+xml"
      );

    if (
      doc.querySelector(
        "parsererror"
      )
    ) {
      throw new Error(
        "The geometry SVG is not valid"
      );
    }

    const sourceSvg =
      doc.documentElement;

    const regionsGroup =
      document.querySelector(
        "#map .regions"
      );

    if (!regionsGroup) {
      throw new Error(
        "No existe #map .regions"
      );
    }

    regionsGroup.innerHTML =
      "";

    sourceSvg
      .querySelectorAll(
        "path, polygon, polyline, circle, ellipse"
      )
      .forEach(
        (shape) => {
          if (
            shape.closest(
              "#points, #label_points"
            )
          ) {
            return;
          }

          const imported =
            document.importNode(
              shape,
              true
            );

          imported.classList.add(
            "country"
          );

          regionsGroup.appendChild(
            imported
          );
        }
      );

    svg.attr(
      "preserveAspectRatio",
      "xMidYMid meet"
    );
  }


  // ============================================================
  // RESPONSIVE
  // ============================================================

  let resizeTimer =
    null;

  window.addEventListener(
    "resize",
    () => {
      clearTimeout(
        resizeTimer
      );

      resizeTimer =
        setTimeout(
          () => {
            if (
              !svg.node()
            ) {
              return;
            }

            renderMap();
          },
          150
        );
    }
  );


  // ============================================================
  // INICIO
  // ============================================================

  async function bootstrap() {
    setupBackToWorldButton();

    if (totalEl) {
      totalEl.textContent =
        Number.isFinite(Number(country.total))
          ? Number(country.total)
          : regions.length;
    }

    try {
      // Solo esperamos la geometría del SVG, que es lo único que
      // renderMap() necesita de verdad para dibujar el mapa. loadRegions()
      // y loadPreviousBest() son llamadas al backend (con su propia
      // latencia de red/BD) que solo hacen falta más tarde, al terminar la
      // partida (guardar progreso / celebrar récord) — así que se lanzan
      // en paralelo, en segundo plano, y ya NO retrasan que el mapa
      // aparezca y se pueda jugar.
      await loadGeometry();

      renderMap();

      updateCount();

      startTimer();

      timerEl.textContent =
        fmtTime(
          QUIZ_SECONDS
        );

      guessEl.disabled =
        false;

      if (submitBtn) {
        submitBtn.disabled =
          false;
      }

      if (loadingOverlay) {
        loadingOverlay.classList.add(
          "hidden"
        );
      }

      setFeedback(
        country.readyMessage ||
          "Mapa listo."
      );

      guessEl.focus();

      Promise.all([
        loadRegions(),
        loadPreviousBest()
      ]).then(() => {
        if (localMode) {
          showToast(
            country.readyLocalMessage ||
              "Modo local (sin conexión con el servidor)."
          );
        }
      });
    } catch (err) {
      console.error(err);

      if (loadingOverlay) {
        loadingOverlay.textContent =
          country.loadErrorMessage ||
          "Could not load the map.";
      }

      setFeedback(
        country.loadErrorMessage ||
          "Could not load the map. Check your connection.",
        "no"
      );
    }
  }


  bootstrap();
})();