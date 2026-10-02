import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONTINENTES, ALIAS, ISO_POR_PAIS } from '../../data/worldQuiz';
import './WorldQuiz.css';

// Same normalisation as the "World countries" mode (and as the keys in data/worldQuiz.js):
// no accents, hyphens/apostrophes/dots become spaces.
function normalizar(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[-’'.]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lista plana: nombre normalizado -> { nombre real, continente }
const TODOS = Object.entries(CONTINENTES).flatMap(([key, c]) =>
  c.paises.map((nombre) => ({ nombre, norm: normalizar(nombre), continente: key }))
);
const TOTAL = TODOS.length; // 197
const POR_NORM = new Map(TODOS.map((p) => [p.norm, p]));

// Chips sorted alphabetically within each continent.
const CONTINENTES_ORDENADOS = Object.entries(CONTINENTES).map(([key, c]) => ({
  key,
  nombre: c.nombre,
  paises: [...c.paises].sort((a, b) => a.localeCompare(b, 'en')).map((n) => ({ nombre: n, norm: normalizar(n) })),
}));

export default function WorldQuizPage() {
  const [encontrados, setEncontrados] = useState(() => new Set()); // set de norm
  const [entrada, setEntrada] = useState('');
  const [feedback, setFeedback] = useState({ msg: '', tipo: '' });
  const inputRef = useRef(null);

  const completo = encontrados.size === TOTAL;

  useEffect(() => { inputRef.current?.focus(); }, []);

  const contadorPorContinente = useMemo(() => {
    const out = {};
    for (const p of TODOS) {
      if (encontrados.has(p.norm)) out[p.continente] = (out[p.continente] || 0) + 1;
    }
    return out;
  }, [encontrados]);

  function onSubmit(e) {
    e.preventDefault();
    const valor = entrada;
    setEntrada('');
    if (!valor.trim()) return;

    let candidato = normalizar(valor);
    if (ALIAS[candidato]) candidato = ALIAS[candidato];
    const pais = POR_NORM.get(candidato);

    if (!pais) {
      setFeedback({ msg: `I don't recognise "${valor.trim()}".`, tipo: 'bad' });
    } else if (encontrados.has(pais.norm)) {
      setFeedback({ msg: `You already have ${pais.nombre}.`, tipo: '' });
    } else {
      const siguiente = new Set(encontrados);
      siguiente.add(pais.norm);
      setEncontrados(siguiente);
      setFeedback({ msg: `${pais.nombre} — ${TOTAL - siguiente.size} to go.`, tipo: 'ok' });
    }
  }

  function jugarDeNuevo() {
    setEncontrados(new Set());
    setEntrada('');
    setFeedback({ msg: '', tipo: '' });
    inputRef.current?.focus();
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="worldquiz-page">
      <header>
        <Link className="btn-back" to="/mapas"><span>←</span> Maps</Link>
        <h1>The 197 countries</h1>
        <p className="subtitle">Type every country in the world from memory, one by one</p>
      </header>

      <main>
        <div className="panel">
          <div className="stat"><span className="num">{encontrados.size} / {TOTAL}</span><span className="lbl">found</span></div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(encontrados.size / TOTAL) * 100}%` }} /></div>
        </div>

        <form onSubmit={onSubmit}>
          <label htmlFor="entrada" className="visually-hidden">Type the name of a country</label>
          <input
            ref={inputRef}
            type="text"
            id="entrada"
            placeholder="Type a country and press Enter…"
            autoComplete="off"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
          />
          <button className="submit" type="submit">Add</button>
        </form>
        <div className={'feedback' + (feedback.tipo ? ' ' + feedback.tipo : '')} aria-live="polite">{feedback.msg}</div>

        <div>
          {CONTINENTES_ORDENADOS.map((c) => (
            <div className="continente" key={c.key}>
              <h2>{c.nombre} <span className="c-count">{contadorPorContinente[c.key] || 0} / {c.paises.length}</span></h2>
              <div className="chips">
                {c.paises.map((p) => {
                  const found = encontrados.has(p.norm);
                  const iso = ISO_POR_PAIS[p.norm];
                  return (
                    <span key={p.norm} className={'chip' + (found ? ' found' : '')}>
                      {found ? (
                        <>
                          {iso && (
                            <img
                              className="bandera"
                              loading="lazy"
                              alt=""
                              src={`https://flagcdn.com/${iso}.svg`}
                              onError={(ev) => { ev.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          {p.nombre}
                        </>
                      ) : '?????'}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={'win' + (completo ? ' show' : '')}>
          <h2>All 197, complete</h2>
          <p>You have named every country in the world.</p>
          <button className="btn-again" type="button" onClick={jugarDeNuevo}>Play again</button>
        </div>
      </main>
    </div>
  );
}
