import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadCountryData, resolveGeoUrl } from '../../lib/countryData';
import { buildTexts, UI } from '../../lib/countryText';
import { createGame } from './gameEngine';
import './Country.css';

// Página del juego de país (/pais?pais=<slug>) — EN ESPAÑOL.
// 1) Carga data/countries/<slug>.js (script -> window.GEOTARIA_COUNTRY).
// 2) Cuando hay datos, monta <CountryGame>, que arranca el motor imperativo
//    (gameEngine.js: D3) dentro de un useEffect.

function LoadingShell({ message, error }) {
  return (
    <section className="game">
      <div className="map-area">
        <div className={'loading-overlay' + (error ? ' error' : '')}>
          <div className="spinner" aria-hidden="true" />
          <span>{message}</span>
        </div>
      </div>
    </section>
  );
}

function CountryGame({ country, texts, geoUrl }) {
  const els = useRef({});
  const setEl = (name) => (node) => { els.current[name] = node; };

  useEffect(() => {
    const game = createGame({ country, texts, geoUrl, els: { ...els.current } });
    return () => game.destroy();
  }, [country, texts, geoUrl]);

  // Los elementos cuyo texto/clases controla el motor (contadores, feedback, pista, toast,
  // lista, pantalla de inicio y de resultado) se renderizan SIN hijos dinámicos:
  // React no los vuelve a tocar.
  return (
    <section className="game">
      <div className="toolbar">
        <div className="progress" aria-live="polite">
          <div className="progress-num">
            <span ref={setEl('count')}>0</span>
            <span className="sep">/</span>
            <span ref={setEl('total')} />
          </div>
          <div className="progress-track" aria-hidden="true"><span ref={setEl('progressBar')} /></div>
        </div>
        <div className="input-wrap">
          <input
            ref={setEl('guess')}
            type="text"
            placeholder={texts.guessPlaceholder}
            aria-label={texts.guessPlaceholder}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled
          />
          <button ref={setEl('submit')} className="btn-primary" type="button" disabled>{texts.submitLabel}</button>
        </div>
      </div>

      <div className="feedback" ref={setEl('feedback')} role="status" aria-live="polite" />

      <div className="map-area" ref={setEl('mapArea')}>
        <svg id="map" ref={setEl('svg')} viewBox="0 0 960 620" aria-label={UI.map}>
          <g className="regions" />
        </svg>
        <div className="map-tools">
          <button ref={setEl('zoomIn')} type="button" title={UI.zoomIn} aria-label={UI.zoomIn}>+</button>
          <button ref={setEl('zoomOut')} type="button" title={UI.zoomOut} aria-label={UI.zoomOut}>−</button>
          <button ref={setEl('resetView')} type="button" title={UI.resetView} aria-label={UI.resetView}>⤢</button>
        </div>
        <div className="hint" ref={setEl('hint')} />
        <div className="toast" ref={setEl('toast')} />

        {/* Pantalla de inicio: la partida no empieza hasta pulsar «Empezar». */}
        <div className="overlay intro hidden" ref={setEl('intro')}>
          <div className="intro-card">
            <p className="intro-kicker">{texts.place}</p>
            <p className="intro-count">{texts.total}</p>
            <p className="intro-label">{texts.introCountLabel}</p>
            <button ref={setEl('start')} className="btn-primary btn-lg" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" /></svg>
              {texts.startLabel}
            </button>
            <p className="intro-note">{texts.introNote}</p>
          </div>
        </div>

        <div className="loading-overlay" ref={setEl('loadingOverlay')}>
          <div className="spinner" aria-hidden="true" />
          <span ref={setEl('loadingText')} />
        </div>
      </div>

      {/* Un recuadro por cada nombre que hay que adivinar: vacíos hasta acertarlos (los rellena el motor). */}
      <div className="slots" ref={setEl('slots')} role="list" aria-label={texts.slotsLabel} />

      <div className="bottom">
        <div className="left-actions">
          <button ref={setEl('missing')} className="secondary regions-btn" type="button">{texts.missingLabel}</button>
          <button ref={setEl('giveUp')} className="secondary" type="button" disabled>{texts.giveUpLabel}</button>
          <button ref={setEl('viewResult')} className="secondary hidden" type="button">{texts.viewResultLabel}</button>
        </div>
        <div className="right-actions">
          <button ref={setEl('reset')} className="secondary" type="button">{texts.resetLabel}</button>
        </div>
      </div>

      <div className="found-scrim" ref={setEl('foundScrim')} />
      <div className="found-drawer" ref={setEl('foundDrawer')}>
        <div className="found-drawer-handle">
          <span>{texts.missingLabel}</span>
          <button type="button" className="icon-btn" ref={setEl('foundDrawerClose')} aria-label={UI.close}>✕</button>
        </div>
        <div className="found-list" ref={setEl('foundList')} />
      </div>

      {/* Pantalla de resultado (al rendirse o al completar el mapa). */}
      <div className="overlay result hidden" ref={setEl('result')} role="dialog" aria-modal="true" aria-labelledby="result-title">
        <div className="result-card">
          <div className="result-badge" aria-hidden="true">
            <svg className="ic-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4h10v4.5a5 5 0 0 1-10 0V4z" /><path d="M7 6H4.5v1.2A3 3 0 0 0 7.4 10.2M17 6h2.5v1.2a3 3 0 0 1-2.9 3" /><path d="M12 13.5V17m-3.5 3.5h7M10 17h4" />
            </svg>
            <svg className="ic-flag" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 21V4" /><path d="M6 5h11l-2.2 3.5L17 12H6" />
            </svg>
          </div>
          <p className="result-eyebrow" ref={setEl('resultEyebrow')} />
          <h2 id="result-title" ref={setEl('resultTitle')} />
          <p className="result-message" ref={setEl('resultMessage')} />

          <div className="result-bar" aria-hidden="true"><span ref={setEl('resultBar')} /></div>
          <dl className="result-stats">
            <div><dt>{texts.resultHitsLabel}</dt><dd ref={setEl('resultHits')} /></div>
            <div><dt>{texts.resultMissingLabel}</dt><dd ref={setEl('resultMissing')} /></div>
            <div><dt>{texts.resultPercentLabel}</dt><dd ref={setEl('resultPercent')} /></div>
          </dl>

          <p className="result-record hidden" ref={setEl('resultRecord')} />

          <div className="result-actions">
            <button ref={setEl('playAgain')} className="btn-primary" type="button">{texts.playAgainLabel}</button>
            <button ref={setEl('viewMap')} className="btn-ghost" type="button">{texts.viewMapLabel}</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CountryGamePage() {
  const [params] = useSearchParams();
  const pais = params.get('pais') || 'spain';
  // state: { pais, status: 'ready'|'error', country, slug }. Mientras `pais` no coincida, está cargando.
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadCountryData(pais)
      .then(({ country, slug }) => {
        if (!cancelled) setLoaded({ pais, status: 'ready', country, slug });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ pais, status: 'error' });
      });
    return () => { cancelled = true; };
  }, [pais]);

  // Esta página está en español.
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = 'es';
    return () => { document.documentElement.lang = prev; };
  }, []);

  const current = loaded && loaded.pais === pais ? loaded : null;
  const ready = current?.status === 'ready';
  const failed = current?.status === 'error';
  // Memorizado por país cargado: el motor se reinicia si cambia `texts`.
  const stableTexts = useMemo(
    () => (current?.status === 'ready' ? buildTexts(current.country, current.slug) : null),
    [current]
  );

  useEffect(() => {
    if (ready) document.title = `Geotaria — ${stableTexts.place}`;
    else document.title = 'Geotaria';
  }, [ready, stableTexts]);

  return (
    <div className="country-page">
      <div className="page">
        <header className="game-header">
          <Link to="/mapa-mundial" className="back-btn">
            <span className="arrow" aria-hidden="true">←</span>
            <span>{ready ? stableTexts.backLabel : 'Mapa mundial'}</span>
          </Link>
          <div className="header-text">
            <p className="kicker">{ready ? stableTexts.kicker : 'Geotaria'}</p>
            <h1>{ready ? stableTexts.title : failed ? UI.notFoundTitle : UI.loadingTitle}</h1>
            <p className="subtitle">{ready ? stableTexts.subtitle : ''}</p>
          </div>
        </header>

        {ready ? (
          <CountryGame
            key={current.slug}
            country={current.country}
            texts={stableTexts}
            geoUrl={resolveGeoUrl(current.country, current.slug)}
          />
        ) : (
          <LoadingShell
            error={failed}
            message={failed ? `No existe data/countries/${pais}.js` : 'Cargando el mapa…'}
          />
        )}
      </div>
    </div>
  );
}
