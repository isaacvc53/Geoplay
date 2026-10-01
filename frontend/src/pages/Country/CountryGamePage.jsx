import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadCountryData, resolveGeoUrl } from '../../lib/countryData';
import { buildTexts, UI } from '../../lib/countryText';
import CountryGame from './CountryGame';
import './Country.css';

// Página del juego de país (/pais?pais=<slug>) — EN INGLÉS.
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

  // Esta página está en inglés.
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = 'en';
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
          <Link to="/mapa-mundial" className="btn-back">
            <span className="arrow" aria-hidden="true">←</span>
            <span className="label">{ready ? stableTexts.backLabel : UI.worldMap}</span>
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
            message={failed ? UI.notFoundMessage(pais) : UI.loadingMap}
          />
        )}
      </div>
    </div>
  );
}
