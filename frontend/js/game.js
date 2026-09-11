// js/game.js
// Motor genérico del juego "adivina la región".
//
// Todo lo específico del país viene de:
// window.GEOPLAY_COUNTRY
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
  const country = window.GEOPLAY_COUNTRY;

  if (!country) {
    console.error(
      "Falta window.GEOPLAY_COUNTRY: pages/country.html debe cargar data/countries/<pais>.js antes de js/game.js"
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

    setTimeout(() => {
      toastEl.classList.remove(
        "show"
      );
    }, 1200);
  }


  // ============================================================
  // CONTADOR
  // ============================================================

  function updateCount() {
    countEl.textContent =
      solved.size;

    if (
      solved.size ===
        regions.length &&
      regions.length
    ) {
      endQuiz(
        country.completeMessage ||
          "¡Completado!",
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
        "Pasa el ratón para ver los nombres";
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
              "Se acabó el tiempo.",
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
            "No se pudo obtener el bounding box de una región.",
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
        "No se pudo calcular el bounding box real del país."
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
    // ANTES:
    // translateExtent era bastante más grande que el país.
    //
    // AHORA:
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
        "¡Correcto! "
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
        "Backend no disponible o país no sembrado, usando modo local",
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

    if (localMode) {
      region =
        findLocalGuess(
          regions,
          raw
        );
    } else {
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

        region =
          findLocalGuess(
            regions,
            raw
          );
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
          "Ya está descubierta."
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
          "Todavía no has acertado ninguna."
      );

      return;
    }

    updateFoundList();

    foundListWrap.classList.toggle(
      "open"
    );
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


  // ============================================================
  // CARGAR GEOMETRÍA
  // ============================================================

  async function loadGeometry() {
    const res =
      await fetch(
        country.geoFile
      );

    if (!res.ok) {
      throw new Error(
        "No se pudo cargar la geometría: HTTP " +
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
        "El SVG de geometría no es válido"
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
    try {
      await loadGeometry();

      await loadRegions();

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
        localMode
          ? country.readyLocalMessage ||
            "Mapa listo en modo local."
          : country.readyMessage ||
            "Mapa listo."
      );

      guessEl.focus();
    } catch (err) {
      console.error(err);

      if (loadingOverlay) {
        loadingOverlay.textContent =
          country.loadErrorMessage ||
          "No se pudo cargar el mapa.";
      }

      setFeedback(
        country.loadErrorMessage ||
          "No se pudo cargar el mapa. Comprueba la conexión.",
        "no"
      );
    }
  }


  bootstrap();
})();