import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CONTINENTS, slugify, normalize, fileSlug } from '../../data/continents';
import './Regions.css';

// Silhouettes live in public/data/geo/<slug>.svg (English file names).
const GEO_PATH = '/data/geo/';

const FALLBACK_SILHOUETTE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a774a" stroke-width="1.4"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.4"/></svg>'
);

function CountryTile({ nameEn, geoSlug, iso, nameEs }) {
  const [flagHidden, setFlagHidden] = useState(false);
  const [silhouetteFailed, setSilhouetteFailed] = useState(false);
  // Nombre real del archivo (p. ej. "usa" para United States / Estados Unidos).
  const esSlug = slugify(nameEs);
  let fileName = null;
  if (fileSlug(geoSlug) !== geoSlug) fileName = fileSlug(geoSlug);
  else if (fileSlug(esSlug) !== esSlug) fileName = fileSlug(esSlug);
  const target = fileName || esSlug;
  const silhouetteSlug = fileName || geoSlug;

  return (
    // The link uses the real file slug when it differs; otherwise the SPANISH name's slug
    // (country.html?pais=...), which CountryGamePage resolves through slugCandidates().
    <Link className="tile" to={`/pais?pais=${target}`}>
      <img
        className="flag"
        loading="lazy"
        alt=""
        src={`https://flagcdn.com/${iso}.svg`}
        style={flagHidden ? { display: 'none' } : undefined}
        onError={() => setFlagHidden(true)}
      />
      <div className="silhouette-wrap">
        <img
          className={'silhouette' + (silhouetteFailed ? ' fallback' : '')}
          loading="lazy"
          alt=""
          src={silhouetteFailed ? FALLBACK_SILHOUETTE : `${GEO_PATH}${silhouetteSlug}.svg`}
          onError={() => setSilhouetteFailed(true)}
        />
      </div>
      <span className="t-name">{nameEn}</span>
    </Link>
  );
}

export default function RegionCountriesPage() {
  const [params] = useSearchParams();
  const zone = CONTINENTS[params.get('zona')];
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () => (zone ? [...zone.countries].sort((a, b) => a[0].localeCompare(b[0], 'en')) : []),
    [zone]
  );

  useEffect(() => {
    document.title = zone ? `Atlas World — ${zone.name}` : 'Atlas World';
  }, [zone]);

  if (!zone) {
    return (
      <div className="regions-page">
        <header>
          <Link className="btn-back" to="/mapas"><span>←</span> Maps</Link>
          <h1>Unrecognized region</h1>
          <p className="subtitle" />
        </header>
        <main>
          <div className="empty">
            This region isn&apos;t recognized. Go back to <Link to="/mapas">the maps</Link>.
          </div>
        </main>
      </div>
    );
  }

  const total = zone.countries.length;
  const q = normalize(query);
  const visibleCount = sorted.filter(([nameEn]) => normalize(nameEn).includes(q)).length;

  return (
    <div className="regions-page">
      <header>
        <Link className="btn-back" to="/mapas"><span>←</span> Maps</Link>
        <h1>{zone.name}</h1>
        <p className="subtitle">{total} countries — choose one to explore</p>
      </header>

      <main>
        <div className="panel">
          <div className="stat"><span className="num">{visibleCount} / {total}</span><span className="lbl">countries</span></div>
          <div className="search-wrap">
            <label htmlFor="search" className="visually-hidden">Search country</label>
            <input
              type="text"
              id="search"
              placeholder="Search country…"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid">
          {sorted.map(([nameEn, geoSlug, iso, nameEs]) => (
            // Filtering by CSS display (not unmounting) keeps loaded images and
            // matches the original behaviour of hiding non-matching tiles.
            <div key={geoSlug} style={normalize(nameEn).includes(q) ? { display: 'contents' } : { display: 'none' }}>
              <CountryTile nameEn={nameEn} geoSlug={geoSlug} iso={iso} nameEs={nameEs} />
            </div>
          ))}
        </div>
        <p className="no-results" style={visibleCount === 0 ? { display: 'block' } : undefined}>
          No country matches your search.
        </p>
      </main>
    </div>
  );
}
