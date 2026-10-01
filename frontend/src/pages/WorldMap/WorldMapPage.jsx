import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { countrySlug } from '../../lib/worldMapSlugs';
import WorldMapCanvas from './WorldMapCanvas';
import './WorldMap.css';

export default function WorldMapPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const watermarkRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [selected, setSelected] = useState(null);

  const closePanel = useCallback(() => setSelected(null), []);

  // Escape cierra el panel.
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') closePanel(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closePanel]);

  // Silueta (D3, imperativa) + foco al abrir el panel.
  useEffect(() => {
    const el = watermarkRef.current;
    if (!el) return undefined;
    el.replaceChildren();
    if (!selected) return undefined;

    // Silueta: si el país tiene varios polígonos (p. ej. Francia con la Guayana)
    // se dibuja solo el más grande (`main`); el viewBox se ajusta a su caja.
    const miniSvg = d3.select(el).append('svg').attr('aria-hidden', 'true');
    const miniPath = miniSvg.append('path').attr('d', selected.main || selected.d);
    const { x, y, width, height } = miniPath.node().getBBox();
    const side = Math.max(width, height) * 1.1 || 1;
    miniSvg.attr('viewBox', [x + width / 2 - side / 2, y + height / 2 - side / 2, side, side]);

    const raf = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [selected]);

  const name = selected?.properties?.name || 'Country';
  // Código alfa-2 (las islas menores de EE. UU. vienen como UM-xx y no tienen bandera).
  const iso2 = /^[A-Z]{2}$/.test(selected?.id || '') ? selected.id.toLowerCase() : '';
  const open = Boolean(selected);

  function explore() {
    if (!selected) return;
    const slug = countrySlug(selected);
    if (!slug) return;
    navigate(`/pais?pais=${encodeURIComponent(slug)}`);
  }

  return (
    <div className="worldmap-page">
      <div className="stage">
        <header>
          <Link className="btn-back" id="backToMenu" to="/">
            <span className="arrow">←</span> Main menu
          </Link>
          <div className="eyebrow-row">
            <h1>Atlas <em>World</em></h1>
            <div className="coords">Equal Earth projection<br />drag to pan · scroll to zoom · select a country</div>
          </div>
        </header>

        <WorldMapCanvas ref={canvasRef} selected={selected} onSelect={setSelected} />

        <div className="zoom-controls">
          <button aria-label="Zoom in" onClick={() => canvasRef.current?.zoomIn()}>+</button>
          <button aria-label="Zoom out" onClick={() => canvasRef.current?.zoomOut()}>–</button>
          <button aria-label="Reset zoom" onClick={() => canvasRef.current?.reset()}>⟲</button>
        </div>
        <div className="scale"><span>0</span><span className="bar" /><span>2000 km</span></div>
      </div>

      <div className={'overlay' + (open ? ' open' : '')} onClick={closePanel} />

      <div
        className={'panel' + (open ? ' open' : '')}
        id="panel"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panelTitle"
      >
        <button className="panel-close" ref={closeBtnRef} aria-label="Close" onClick={closePanel}>✕</button>
        <div className="panel-watermark" ref={watermarkRef} aria-hidden="true" />
        <div className="panel-scroll">
          <div className="panel-header">
            <img
              className="panel-flag"
              alt={iso2 ? `Flag of ${name}` : ''}
              loading="lazy"
              src={iso2 ? `https://flagcdn.com/w160/${iso2}.png` : undefined}
              style={{ display: iso2 ? 'block' : 'none' }}
            />
            <div className="panel-heading">
              <h2 className="panel-title" id="panelTitle">{selected ? name : '—'}</h2>
              <span className="panel-code" style={{ display: iso2 ? 'inline-block' : 'none' }}>{iso2.toUpperCase()}</span>
            </div>
          </div>

          <p className="panel-sub">Choose a level to explore its internal divisions.</p>

          <button className="action-primary" type="button" onClick={explore}>
            <span className="a-title">Explore regions</span>
            <span className="a-desc">States, provinces, or their administrative equivalent.</span>
          </button>

          <p className="panel-note">Municipalities, districts, and other levels: in development.</p>
        </div>
      </div>
    </div>
  );
}
