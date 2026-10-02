import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONTINENTS, TOTAL, buildGame, exactMatch, submitMatch, autoWait, formatTime } from './countriesLogic';
import { createMapEngine } from './mapEngine';
import '../WorldRegions/WorldRegions.css';   // same layout and mobile design as "World subdivisions"
import './WorldCountries.css';

const nf = new Intl.NumberFormat('en');
const LABEL = Object.fromEntries(CONTINENTS.map((c) => [c.key, c.label]));

export default function WorldCountriesPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [solved, setSolved] = useState(() => new Set());   // the game only lives in memory
  const [ms, setMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', kind: '' });
  const [text, setText] = useState('');
  const [waiting, setWaiting] = useState(false);

  const svgRef = useRef(null), tipRef = useRef(null), inputRef = useRef(null);
  const engine = useRef(null), solvedRef = useRef(solved), auto = useRef(null);
  useEffect(() => { solvedRef.current = solved; }, [solved]);

  useEffect(() => {
    let alive = true;
    fetch('/data/world-topology.json').then((r) => { if (!r.ok) throw new Error('Could not load the map.'); return r.json(); })
      .then((topo) => alive && setData(buildGame(topo))).catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return undefined;
    const eng = createMapEngine({ svg: svgRef.current, tip: tipRef.current, ...data });
    engine.current = eng;
    return () => { eng.destroy(); engine.current = null; };
  }, [data]);

  const count = solved.size;
  const done = count === TOTAL;
  const running = started && !paused && !gaveUp && !done;
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setMs((m) => m + 1000), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => { if (running) inputRef.current?.focus(); }, [running]);
  useEffect(() => () => clearTimeout(auto.current), []);

  // Warn if the tab is closed or reloaded mid-game (nothing is saved).
  const inGame = started && !gaveUp && !done;
  useEffect(() => {
    if (!inGame || count === 0) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [inGame, count]);

  function resetState() {
    clearTimeout(auto.current);
    const empty = new Set();
    solvedRef.current = empty;
    setSolved(empty); setMs(0); setPaused(false); setGaveUp(false); setWaiting(false);
    setFeedback({ text: '', kind: '' }); setText('');
    engine.current?.clear(); engine.current?.resetView();
  }
  function start() { resetState(); setStarted(true); }
  function backToStart() { resetState(); setStarted(false); }
  const confirmLose = () => !inGame || count === 0 || window.confirm('This ends the current game and you will lose your progress. Continue?');
  function restart() { if (confirmLose()) start(); }

  const accept = useCallback((c) => {
    const next = new Set(solvedRef.current);
    next.add(c.id);
    solvedRef.current = next;
    setSolved(next);
    engine.current?.add([c], true);
    setFeedback({ kind: 'ok', text: `✓ ${c.nombre} · ${LABEL[c.continente]} — ${TOTAL - next.size} to go` });
    setText('');
  }, []);

  function onChange(e) {
    const value = e.target.value;
    setText(value);
    clearTimeout(auto.current); setWaiting(false);
    if (!running) return;
    const m = exactMatch(value, solvedRef.current);
    if (m.status !== 'hit') return;
    const wait = autoWait(value, solvedRef.current);
    if (wait === 0) accept(m.country);
    else { setWaiting(true); auto.current = setTimeout(() => { setWaiting(false); accept(m.country); }, wait); }
  }

  function submit(e) {
    e?.preventDefault();
    clearTimeout(auto.current); setWaiting(false);
    if (!running || !text.trim()) return;
    const m = submitMatch(text, solvedRef.current);
    if (m.status === 'hit') accept(m.country);
    else if (m.status === 'dup') { setFeedback({ kind: 'warn', text: `You already have ${m.country.nombre}.` }); setText(''); }
    else if (m.status === 'ambiguous') setFeedback({ kind: 'warn', text: `${m.count} countries match: type the full name.` });
    else setFeedback({ kind: 'bad', text: `I don't recognise "${text.trim()}".` });
  }

  function giveUp() {
    if (!window.confirm('Give up? The countries you missed will be shown.')) return;
    engine.current?.reveal(data.countries.filter((c) => !solvedRef.current.has(c.id)));
    setGaveUp(true);
  }

  const perContinent = useMemo(() => CONTINENTS.map((c) => ({
    ...c, got: data ? data.countries.reduce((n, x) => n + (x.continente === c.key && solved.has(x.id) ? 1 : 0), 0) : 0,
  })), [data, solved]);
  const pct = Math.round((count / TOTAL) * 100);

  return (
    <div className="worldregions-page worldcountries-page">
      <header className="wr-top">
        <Link className="btn-back" to="/modo"><span>←</span> Modes</Link>
        <div className="wr-title">
          <h1>World countries</h1>
          <p className="subtitle">Name all 197 countries from memory and the map fills in.</p>
        </div>
      </header>

      {error && <p className="wr-error">{error}</p>}

      <section className="wr-game">
        <div className="wr-sticky">
          <div className="wr-toolbar">
            <div className="wr-progress" aria-live="polite">
              <div className="wr-count"><b>{nf.format(count)}</b><i>/</i><span>{nf.format(TOTAL)}</span><em>{pct}%</em></div>
              <div className="wr-track"><span style={{ width: `${pct}%` }} /></div>
            </div>
            <form className="wr-input" onSubmit={submit}>
              <input
                ref={inputRef} value={text} onChange={onChange} disabled={!running} className={waiting ? 'waiting' : ''}
                placeholder={running ? 'Type a country…' : 'Press "Start"'}
                autoComplete="off" autoCapitalize="off" autoCorrect="off" enterKeyHint="go" spellCheck={false} aria-label="Country name"
              />
              <button className="wr-btn primary" type="submit" disabled={!running}>Add</button>
            </form>
            <div className="wr-actions">
              <span className="wr-time" title="Time played">⏱ {formatTime(ms)}</span>
              <button className="wr-btn" type="button" disabled={!started || gaveUp || done} onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</button>
              <button className="wr-btn" type="button" disabled={!started || gaveUp || done} onClick={giveUp}>Give up</button>
              <button className="wr-btn" type="button" disabled={!started} onClick={restart}>Restart</button>
            </div>
          </div>
          <div className={`wr-feedback ${feedback.kind}`} role="status">{feedback.text || '\u00a0'}</div>
        </div>

        <div className="wr-body">
          <div className="wr-map">
            <svg ref={svgRef} aria-label="World map of countries" />
            <div className="wr-tip" ref={tipRef} />
            <div className="wr-tools">
              <button type="button" aria-label="Zoom in" onClick={() => engine.current?.zoomBy(1.6)}>+</button>
              <button type="button" aria-label="Zoom out" onClick={() => engine.current?.zoomBy(1 / 1.6)}>−</button>
              <button type="button" aria-label="Reset view" onClick={() => engine.current?.resetView()}>⤢</button>
            </div>
            <div className="wr-hint">Drag to pan · scroll or pinch to zoom</div>

            {!data && !error && <div className="wr-overlay"><div className="wr-spinner" /><p>Loading map…</p></div>}

            {data && !started && (
              <div className="wr-overlay start">
                <div className="wr-card">
                  <p className="wr-kicker">The {TOTAL} countries of the world</p>
                  <button className="wr-btn primary" type="button" onClick={start}>Start game</button>
                  <p className="wr-note">Every game starts from scratch and is not saved. Tiny countries (Monaco, Malta, Maldives…) show up as a dot on the map.</p>
                </div>
              </div>
            )}

            {paused && !done && !gaveUp && (
              <div className="wr-overlay"><div className="wr-card"><p className="wr-kicker">Paused</p>
                <button className="wr-btn primary" type="button" onClick={() => setPaused(false)}>Resume</button></div></div>
            )}

            {(done || gaveUp) && (
              <div className="wr-result">
                <b>{done ? 'All 197 complete!' : 'You gave up'}</b>
                <span>{nf.format(count)} of {nf.format(TOTAL)} · {formatTime(ms)} played</span>
                <button className="wr-btn primary" type="button" onClick={start}>Play again</button>
                <button className="wr-btn" type="button" onClick={backToStart}>Exit</button>
              </div>
            )}
          </div>

          <aside className="wr-side">
            <div className="wr-side-head"><div className="wr-zone-now"><span>Continents</span><b>{count}/{TOTAL}</b></div></div>
            <ul className="wr-countries">
              {perContinent.map((c) => (
                <li key={c.key}>
                  <button type="button" className={c.got === c.total ? 'full' : ''} onClick={() => engine.current?.focus(c.key)} title="Go to continent">
                    <span>{c.label}</span><em>{c.got}/{c.total}</em>
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
