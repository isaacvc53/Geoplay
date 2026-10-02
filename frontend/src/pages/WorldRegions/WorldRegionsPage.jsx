import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ZONES, loadWorldRegions, buildScope, exactMatch, submitMatch, autoWait,
  loadProgress, saveProgress, formatTime,
} from '../../lib/worldRegions';
import { createMapEngine } from './mapEngine';
import './WorldRegions.css';

const nf = new Intl.NumberFormat('es');

export default function WorldRegionsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [zone, setZone] = useState(null);           // null = pantalla de inicio
  const [solved, setSolved] = useState(() => loadProgress().solved);
  const [ms, setMs] = useState(() => loadProgress().ms);
  const [paused, setPaused] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', kind: '' });
  const [text, setText] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);

  const svgRef = useRef(null), tipRef = useRef(null), inputRef = useRef(null);
  const engine = useRef(null), timer = useRef(null), solvedRef = useRef(solved);
  useEffect(() => { solvedRef.current = solved; }, [solved]);

  useEffect(() => {
    let alive = true;
    loadWorldRegions().then((d) => alive && setData(d)).catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, []);

  const scope = useMemo(() => (data && zone ? buildScope(data.regions, zone) : null), [data, zone]);

  // Mapa: se crea al cargar los datos y se reproyecta al cambiar de zona.
  useEffect(() => {
    if (!data || !svgRef.current) return undefined;
    const eng = createMapEngine({ svg: svgRef.current, tip: tipRef.current, topo: data.topo, regions: data.regions });
    engine.current = eng;
    return () => { eng.destroy(); engine.current = null; };
  }, [data]);
  useEffect(() => {
    if (scope && engine.current) { engine.current.setScope(scope, solvedRef.current); setGaveUp(false); }
  }, [scope]);

  // Cronómetro + guardado (solo corre jugando, sin pausa y sin haberse rendido).
  const total = scope ? scope.list.length : 0;
  const count = useMemo(() => (scope ? scope.list.reduce((n, r) => n + (solved.has(r.id) ? 1 : 0), 0) : 0), [scope, solved]);
  const done = total > 0 && count === total;
  const running = Boolean(scope) && !paused && !gaveUp && !done;
  useEffect(() => {
    if (!running) return undefined;
    timer.current = setInterval(() => setMs((m) => m + 1000), 1000);
    return () => clearInterval(timer.current);
  }, [running]);
  useEffect(() => {
    const t = setTimeout(() => saveProgress(solved, ms), 400);
    return () => clearTimeout(t);
  }, [solved, ms]);
  useEffect(() => { if (running) inputRef.current?.focus(); }, [running, scope]);

  const accept = useCallback((regions) => {
    const next = new Set(solvedRef.current);
    regions.forEach((r) => next.add(r.id));
    solvedRef.current = next;
    setSolved(next);
    engine.current?.add(regions, true);
    const first = regions[0];
    setFeedback({
      kind: 'ok',
      text: regions.length === 1 ? `✓ ${first.name} · ${first.country}` : `✓ ${first.name} · ${regions.length} regiones (${[...new Set(regions.map((r) => r.country))].slice(0, 3).join(', ')}${new Set(regions.map((r) => r.country)).size > 3 ? '…' : ''})`,
    });
    setText('');
  }, []);

  const auto = useRef(null);
  function onChange(e) {
    const value = e.target.value;
    setText(value);
    clearTimeout(auto.current);
    if (!scope || !running) return;
    const m = exactMatch(scope, value, solvedRef.current);
    if (m.status !== 'hit') return;
    const wait = autoWait(scope, value, solvedRef.current);
    if (wait === 0) accept(m.regions);
    else auto.current = setTimeout(() => accept(m.regions), wait);
  }
  useEffect(() => () => clearTimeout(auto.current), []);

  function submit(e) {
    e?.preventDefault();
    clearTimeout(auto.current);
    if (!scope || !running || !text.trim()) return;
    const m = submitMatch(scope, text, solvedRef.current);
    if (m.status === 'hit') accept(m.regions);
    else if (m.status === 'dup') { setFeedback({ kind: 'warn', text: 'Esa ya la tienes.' }); setText(''); }
    else if (m.status === 'ambiguous') setFeedback({ kind: 'warn', text: `Hay ${m.count} regiones que encajan: escribe el nombre completo.` });
    else setFeedback({ kind: 'bad', text: `No encuentro «${text.trim()}» en esta zona.` });
  }

  function giveUp() {
    if (!scope || !window.confirm('¿Rendirte? Se mostrarán las regiones que te faltan.')) return;
    engine.current?.reveal(scope.list.filter((r) => !solvedRef.current.has(r.id)));
    setGaveUp(true);
  }
  function resetZone() {
    if (!scope || !window.confirm(`¿Borrar tu progreso en «${ZONES.find((z) => z.key === zone).label}»?`)) return;
    const next = new Set(solvedRef.current);
    scope.list.forEach((r) => next.delete(r.id));
    solvedRef.current = next; setSolved(next); setGaveUp(false); setFeedback({ text: '', kind: '' });
    engine.current?.setScope(scope, next);
  }

  // Progreso por país de la zona (lista lateral).
  const countries = useMemo(() => {
    if (!scope) return [];
    const m = new Map();
    for (const r of scope.list) {
      if (!m.has(r.a3)) m.set(r.a3, { a3: r.a3, name: r.country, total: 0, got: 0, list: [] });
      const c = m.get(r.a3); c.total += 1; c.list.push(r); if (solved.has(r.id)) c.got += 1;
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [scope, solved]);

  const zoneStats = useMemo(() => {
    if (!data) return {};
    const out = {};
    for (const z of ZONES) {
      const l = data.regions.filter((r) => z.key === 'mundo' || r.zone === z.key);
      out[z.key] = { total: l.length, got: l.reduce((n, r) => n + (solved.has(r.id) ? 1 : 0), 0) };
    }
    return out;
  }, [data, solved]);

  const pct = total ? Math.round((count / total) * 100) : 0;

  return (
    <div className="worldregions-page">
      <header className="wr-top">
        <Link className="btn-back" to="/modo"><span>←</span> Modos</Link>
        <div className="wr-title">
          <h1>Subdivisiones del mundo</h1>
          <p className="subtitle">Escribe provincias, estados y regiones: el mapa se irá rellenando.</p>
        </div>
      </header>

      {error && <p className="wr-error">{error}</p>}

      <section className="wr-game">
        <div className="wr-toolbar">
          <div className="wr-progress" aria-live="polite">
            <div className="wr-count"><b>{nf.format(count)}</b><i>/</i><span>{nf.format(total)}</span><em>{pct}%</em></div>
            <div className="wr-track"><span style={{ width: `${pct}%` }} /></div>
          </div>
          <form className="wr-input" onSubmit={submit}>
            <input
              ref={inputRef} value={text} onChange={onChange} disabled={!running}
              placeholder={running ? 'Escribe una provincia, estado o región…' : 'Elige una zona para empezar'}
              autoComplete="off" autoCapitalize="off" spellCheck={false} aria-label="Nombre de la región"
            />
            <button className="wr-btn primary" type="submit" disabled={!running}>Comprobar</button>
          </form>
          <div className="wr-actions">
            <span className="wr-time" title="Tiempo jugado">⏱ {formatTime(ms)}</span>
            <button className="wr-btn" type="button" disabled={!scope || gaveUp || done} onClick={() => setPaused((p) => !p)}>{paused ? 'Reanudar' : 'Pausa'}</button>
            <button className="wr-btn" type="button" disabled={!scope || gaveUp || done} onClick={giveUp}>Rendirme</button>
            <button className="wr-btn" type="button" disabled={!scope} onClick={resetZone}>Reiniciar zona</button>
          </div>
        </div>
        <div className={`wr-feedback ${feedback.kind}`} role="status">{feedback.text || '\u00a0'}</div>

        <div className="wr-body">
          <div className="wr-map">
            <svg ref={svgRef} aria-label="Mapa mundial de subdivisiones" />
            <div className="wr-tip" ref={tipRef} />
            <div className="wr-tools">
              <button type="button" aria-label="Acercar" onClick={() => engine.current?.zoomBy(1.6)}>+</button>
              <button type="button" aria-label="Alejar" onClick={() => engine.current?.zoomBy(1 / 1.6)}>−</button>
              <button type="button" aria-label="Restablecer vista" onClick={() => engine.current?.resetView()}>⤢</button>
            </div>
            <div className="wr-hint">Arrastra para mover · rueda o pellizco para zoom</div>

            {!data && !error && <div className="wr-overlay"><div className="wr-spinner" /><p>Cargando mapa…</p></div>}

            {data && !zone && (
              <div className="wr-overlay start">
                <div className="wr-card">
                  <p className="wr-kicker">Elige una zona</p>
                  <div className="wr-zones">
                    {ZONES.map((z) => {
                      const s = zoneStats[z.key] || { total: 0, got: 0 };
                      return (
                        <button key={z.key} type="button" className="wr-zone" onClick={() => setZone(z.key)}>
                          <strong>{z.label}</strong>
                          <span>{nf.format(s.got)} / {nf.format(s.total)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="wr-note">Tu progreso se guarda en este navegador. Si un nombre lo comparten varias regiones (p. ej. «Central»), se rellenan todas a la vez.</p>
                </div>
              </div>
            )}

            {paused && !done && !gaveUp && (
              <div className="wr-overlay"><div className="wr-card"><p className="wr-kicker">En pausa</p>
                <button className="wr-btn primary" type="button" onClick={() => setPaused(false)}>Reanudar</button></div></div>
            )}

            {(done || gaveUp) && (
              <div className="wr-result">
                <b>{done ? '¡Zona completada!' : 'Te has rendido'}</b>
                <span>{nf.format(count)} de {nf.format(total)} · {formatTime(ms)} jugados</span>
                <button className="wr-btn" type="button" onClick={() => { engine.current?.clearMissed(); setGaveUp(false); setZone(null); }}>Cambiar de zona</button>
              </div>
            )}
          </div>

          <aside className="wr-side">
            <div className="wr-side-head">
              <label>Zona
                <select value={zone || ''} onChange={(e) => e.target.value && setZone(e.target.value)} disabled={!data}>
                  {!zone && <option value="">—</option>}
                  {ZONES.map((z) => <option key={z.key} value={z.key}>{z.label}</option>)}
                </select>
              </label>
              <label className="wr-check"><input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Solo pendientes</label>
            </div>
            <ul className="wr-countries">
              {countries.filter((c) => !onlyPending || c.got < c.total).map((c) => (
                <li key={c.a3}>
                  <button type="button" className={c.got === c.total ? 'full' : ''} onClick={() => engine.current?.focus(c.list)} title="Ir al país">
                    <span>{c.name}</span><em>{c.got}/{c.total}</em>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </div>
  );
}
