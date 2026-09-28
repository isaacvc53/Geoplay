import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONTINENTES, ALIAS, ISO_POR_PAIS } from '../../data/worldQuiz';
import './WorldQuiz.css';

function normalizar(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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

// Chips ordenados alfabéticamente (locale "es") dentro de cada continente.
const CONTINENTES_ORDENADOS = Object.entries(CONTINENTES).map(([key, c]) => ({
  key,
  nombre: c.nombre,
  paises: [...c.paises].sort((a, b) => a.localeCompare(b, 'es')).map((n) => ({ nombre: n, norm: normalizar(n) })),
}));

function formatTiempo(segundos) {
  const m = String(Math.floor(segundos / 60)).padStart(2, '0');
  const s = String(segundos % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function WorldQuizPage() {
  const [encontrados, setEncontrados] = useState(() => new Set()); // set de norm
  const [empezado, setEmpezado] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [entrada, setEntrada] = useState('');
  const [feedback, setFeedback] = useState({ msg: '', tipo: '' });
  const inputRef = useRef(null);

  const completo = encontrados.size === TOTAL;

  // Cronómetro: arranca con el primer envío, se detiene al completar.
  useEffect(() => {
    if (!empezado || completo) return undefined;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [empezado, completo]);

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

    if (!empezado) setEmpezado(true);

    let candidato = normalizar(valor);
    if (ALIAS[candidato]) candidato = ALIAS[candidato];
    const pais = POR_NORM.get(candidato);

    if (!pais) {
      setFeedback({ msg: `No reconozco "${valor.trim()}".`, tipo: 'bad' });
    } else if (encontrados.has(pais.norm)) {
      setFeedback({ msg: `Ya tenías ${pais.nombre}.`, tipo: '' });
    } else {
      const siguiente = new Set(encontrados);
      siguiente.add(pais.norm);
      setEncontrados(siguiente);
      setFeedback({ msg: `${pais.nombre} — ${TOTAL - siguiente.size} por descubrir.`, tipo: 'ok' });
    }
  }

  function jugarDeNuevo() {
    setEncontrados(new Set());
    setEmpezado(false);
    setSegundos(0);
    setEntrada('');
    setFeedback({ msg: '', tipo: '' });
    inputRef.current?.focus();
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="worldquiz-page">
      <header>
        <Link className="btn-back" to="/modo"><span>←</span> Elegir modo</Link>
        <h1>Los 197 países</h1>
        <p className="subtitle">Escribe de memoria todos los países del mundo, uno por uno</p>
      </header>

      <main>
        <div className="panel">
          <div className="stat"><span className="num">{encontrados.size} / {TOTAL}</span><span className="lbl">encontrados</span></div>
          <div className="stat"><span className="num">{formatTiempo(segundos)}</span><span className="lbl">tiempo</span></div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(encontrados.size / TOTAL) * 100}%` }} /></div>
        </div>

        <form onSubmit={onSubmit}>
          <label htmlFor="entrada" className="visually-hidden">Escribe el nombre de un país</label>
          <input
            ref={inputRef}
            type="text"
            id="entrada"
            placeholder="Escribe un país y pulsa Intro…"
            autoComplete="off"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
          />
          <button className="submit" type="submit">Añadir</button>
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
          <h2>Los 197, completos</h2>
          <p>Lo has conseguido en {formatTiempo(segundos)}.</p>
          <button className="btn-again" type="button" onClick={jugarDeNuevo}>Jugar de nuevo</button>
        </div>
      </main>
    </div>
  );
}
