import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ZONES, loadWorldRegions, buildScope, exactMatch, submitMatch, autoWait,
  clearLegacyProgress, formatTime,
} from '../../lib/worldRegions';
import { createMapEngine } from './mapEngine';
import './WorldRegions.css';

const nf = new Intl.NumberFormat('en');

export default function WorldRegionsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [zone, setZone] = useState(null);           // null = pantalla de inicio
  const [solved, setSolved] = useState(() => new Set());   // la partida vive solo en memoria
  const [ms, setMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', kind: '' });
  const [text, setText] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [waiting, setWaiting] = useState(false);          // acierto detectado, esperando por si sigues escribiendo
  useEffect(() => { clearLegacyProgress(); }, []);        // borra el guardado de versiones anteriores

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
  // Aviso si se cierra o recarga la pestaña con la partida a medias (no se guarda nada).
  const inGame = Boolean(scope) && !gaveUp && !done;
  useEffect(() => {
    if (!inGame || count === 0) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [inGame, count]);
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
      text: regions.length === 1 ? `✓ ${first.name} · ${first.country}` : `✓ ${first.name} · ${regions.length} regions (${[...new Set(regions.map((r) => r.country))].slice(0, 3).join(', ')}${new Set(regions.map((r) => r.country)).size > 3 ? '…' : ''})`,
    });
    setText('');
  }, []);

  const auto = useRef(null);
  function onChange(e) {
    const value = e.target.value;
    setText(value);
    clearTimeout(auto.current); setWaiting(false);
    if (!scope || !running) return;
    const m = exactMatch(scope, value, solvedRef.current);
    if (m.status !== 'hit') return;
    const wait = autoWait(scope, value, solvedRef.current);
    if (wait === 0) accept(m.regions);
    else { setWaiting(true); auto.current = setTimeout(() => { setWaiting(false); accept(m.regions); }, wait); }
  }
  useEffect(() => () => clearTimeout(auto.current), []);

  function submit(e) {
    e?.preventDefault();
    clearTimeout(auto.current); setWaiting(false);
    if (!scope || !running || !text.trim()) return;
    const m = submitMatch(scope, text, solvedRef.current);
    if (m.status === 'hit') accept(m.regions);
    else if (m.status === 'dup') { setFeedback({ kind: 'warn', text: 'You already have that one.' }); setText(''); }
    else if (m.status === 'ambiguous') setFeedback({ kind: 'warn', text: `${m.count} regions match: type the full name.` });
    else setFeedback({ kind: 'bad', text: `Can't find "${text.trim()}" in this zone.` });
  }

  function giveUp() {
    if (!scope || !window.confirm('Give up? The regions you missed will be shown.')) return;
    engine.current?.reveal(scope.list.filter((r) => !solvedRef.current.has(r.id)));
    setGaveUp(true);
  }
  // Nueva partida: siempre desde cero (progreso y cronómetro).
  function newGame(key) {
    clearTimeout(auto.current);
    const empty = new Set();
    solvedRef.current = empty;
    setSolved(empty); setMs(0); setPaused(false); setGaveUp(false);
    setFeedback({ text: '', kind: '' }); setText('');
    if (key === zone && scope) engine.current?.setScope(scope, empty);   // misma zona: el scope no cambia, hay que redibujar
    else setZone(key);
  }
  const confirmLose = () => !inGame || count === 0 || window.confirm('This will end the current game and you will lose your progress. Continue?');
  function restart() { if (scope && confirmLose()) newGame(zone); }
  function backToStart() {
    clearTimeout(auto.current);
    const empty = new Set();
    solvedRef.current = empty;
    engine.current?.clear();
    setSolved(empty); setMs(0); setPaused(false); setGaveUp(false);
    setFeedback({ text: '', kind: '' }); setText('');
    setZone(null);
  }

  // Progreso por país de la zona (lista lateral).
  const countries = useMemo(() => {
    if (!scope) return [];
    const m = new Map();
    for (const r of scope.list) {
      if (!m.has(r.a3)) m.set(r.a3, { a3: r.a3, name: r.country, total: 0, got: 0, list: [] });
      const c = m.get(r.a3); c.total += 1; c.list.push(r); if (solved.has(r.id)) c.got += 1;
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'));
  }, [scope, solved]);

  const zoneTotals = useMemo(() => {
    if (!data) return {};
    const out = {};
    for (const z of ZONES) out[z.key] = data.regions.filter((r) => z.key === 'mundo' || r.zone === z.key).length;
    return out;
  }, [data]);

  const pct = total ? Math.round((count / total) * 100) : 0;

  return (
    <div className="worldregions-page">
      <header className="wr-top">
        <Link className="btn-back" to="/modo"><span>←</span> Modes</Link>
        <div className="wr-title">
          <h1>World subdivisions</h1>
          <p className="subtitle">Type provinces, states and regions: the map fills in as you go.</p>
        </div>
      </header>

      {error && <p className="wr-error">{error}</p>}

      <section className="wr-game">
        <div className="wr-sticky">
        <div className="wr-toolbar">
          <div className="wr-progress" aria-live="polite">
            <div className="wr-count"><b>{nf.format(count)}</b><i>/</i><span>{nf.format(total)}</span><em>{pct}%</em></div>
            <div className="wr-track"><span style={{ width: `${pct}%` }} /></div>
          </div>
          <form className="wr-input" onSubmit={submit}>
            <input
              ref={inputRef} value={text} onChange={onChange} disabled={!running} className={waiting ? 'waiting' : ''}
              placeholder={running ? 'Province, state or region…' : 'Pick a zone to start'}
              autoComplete="off" autoCapitalize="off" autoCorrect="off" enterKeyHint="go" spellCheck={false} aria-label="Region name"
            />
            <button className="wr-btn primary" type="submit" disabled={!running}>Check</button>
          </form>
          <div className="wr-actions">
            <span className="wr-time" title="Time played">⏱ {formatTime(ms)}</span>
            <button className="wr-btn" type="button" disabled={!scope || gaveUp || done} onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</button>
            <button className="wr-btn" type="button" disabled={!scope || gaveUp || done} onClick={giveUp}>Give up</button>
            <button className="wr-btn" type="button" disabled={!scope} onClick={restart}>Restart</button>
          </div>
        </div>
        <div className={`wr-feedback ${feedback.kind}`} role="status">{feedback.text || '\u00a0'}</div>
        </div>

        <div className="wr-body">
          <div className="wr-map">
            <svg ref={svgRef} aria-label="World map of subdivisions" />
            <div className="wr-tip" ref={tipRef} />
            <div className="wr-tools">
              <button type="button" aria-label="Zoom in" onClick={() => engine.current?.zoomBy(1.6)}>+</button>
              <button type="button" aria-label="Zoom out" onClick={() => engine.current?.zoomBy(1 / 1.6)}>−</button>
              <button type="button" aria-label="Reset view" onClick={() => engine.current?.resetView()}>⤢</button>
            </div>
            <div className="wr-hint">Drag to pan · scroll or pinch to zoom</div>

            {!data && !error && <div className="wr-overlay"><div className="wr-spinner" /><p>Loading map…</p></div>}

            {data && !zone && (
              <div className="wr-overlay start">
                <div className="wr-card">
                  <p className="wr-kicker">Choose a zone to start a new game</p>
                  <div className="wr-zones">
                    {ZONES.map((z) => {
                      return (
                        <button key={z.key} type="button" className="wr-zone" onClick={() => newGame(z.key)}>
                          <strong>{z.label}</strong>
                          <span>{nf.format(zoneTotals[z.key] || 0)} regions</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="wr-note">Each game starts from zero and is not saved: finish it, give up or restart. If several regions share a name (e.g. "Central"), they all fill in at once.</p>
                </div>
              </div>
            )}

            {paused && !done && !gaveUp && (
              <div className="wr-overlay"><div className="wr-card"><p className="wr-kicker">Paused</p>
                <button className="wr-btn primary" type="button" onClick={() => setPaused(false)}>Resume</button></div></div>
            )}

            {(done || gaveUp) && (
              <div className="wr-result">
                <b>{done ? 'Zone complete!' : 'You gave up'}</b>
                <span>{nf.format(count)} of {nf.format(total)} · {formatTime(ms)} played</span>
                <button className="wr-btn primary" type="button" onClick={() => newGame(zone)}>Play again</button>
                <button className="wr-btn" type="button" onClick={backToStart}>Change zone</button>
              </div>
            )}
          </div>

          <aside className="wr-side">
            <div className="wr-side-head">
              <div className="wr-zone-now"><span>Zone</span><b>{zone ? ZONES.find((z) => z.key === zone).label : '—'}</b></div>
              <label className="wr-check"><input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Only pending</label>
            </div>
            <ul className="wr-countries">
              {countries.filter((c) => !onlyPending || c.got < c.total).map((c) => (
                <li key={c.a3}>
                  <button type="button" className={c.got === c.total ? 'full' : ''} onClick={() => engine.current?.focus(c.list)} title="Go to country">
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
