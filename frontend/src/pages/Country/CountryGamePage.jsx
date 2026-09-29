import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadCountryData, resolveGeoUrl } from '../../lib/countryData';
import { buildTexts, UI } from '../../lib/countryText';
import { createGame } from './gameEngine';
import './Country.css';

// Página del juego de país (/pais?pais=<slug>) — EN ESPAÑOL.
// 1) Carga data/countries/<slug>.js (script -> window.GEOTARIA_COUNTRY).
// 2) Cuando hay datos, monta <CountryGame>, que arranca el motor imperativo
//    (gameEngine.js: D3 + temporizador) dentro de un useEffect.

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

  // Los elementos cuyo texto/clases controla el motor (timer, feedback, contadores,
  // pausa, pista, toast, lista) se renderizan SIN hijos: React no los vuelve a tocar.
  return (
    <section className="game">
      <div className="toolbar">
        <div className="progress"><span ref={setEl('count')}>0</span> / <span ref={setEl('total')} /></div>
        <div className="input-wrap">
          <input ref={setEl('guess')} type="text" placeholder={texts.guessPlaceholder} autoComplete="off" autoFocus disabled />
          <button ref={setEl('submit')} disabled>{texts.submitLabel}</button>
        </div>
        <div ref={setEl('timer')} className="timer" />
        <button ref={setEl('pause')} className="secondary" type="button" />
      </div>

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
        <div className="loading-overlay" ref={setEl('loadingOverlay')}>
          <div className="spinner" aria-hidden="true" />
          <span ref={setEl('loadingText')} />
        </div>
        <div className="toast" ref={setEl('toast')} />
      </div>

      {/* Un recuadro por cada nombre que hay que adivinar: vacíos hasta acertarlos (los rellena el motor). */}
      <div className="slots" ref={setEl('slots')} role="list" aria-label={texts.slotsLabel} />

      <div className="feedback" ref={setEl('feedback')} />

      <div className="bottom">
        <div className="left-actions">
          <button ref={setEl('missing')} className="secondary regions-btn" type="button">{texts.missingLabel}</button>
          <button ref={setEl('giveUp')} className="secondary" type="button">{texts.giveUpLabel}</button>
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
