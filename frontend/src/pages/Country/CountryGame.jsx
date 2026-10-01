import { memo, useEffect, useRef } from 'react';
import { UI } from '../../lib/countryText';
import { createGame } from './gameEngine';

// Mapa + entrada + recuadros del juego de país. Lo usan:
//   - CountryGamePage (modo individual, sin `online`)
//   - la partida 1 contra 1 (pages/Match), con `online` y `phase`; ver gameEngine.js.

function CountryGame({ country, texts, geoUrl, online, phase = 'waiting', rivalIds = null, bottom = null }) {
  const els = useRef({});
  const setEl = (name) => (node) => { els.current[name] = node; };
  const gameRef = useRef(null);
  const phaseRef = useRef(phase);
  const rivalRef = useRef(rivalIds);
  const onlineRef = useRef(online);
  const isOnline = Boolean(online);

  // Siempre se llama a la última versión de los callbacks online sin reiniciar el motor.
  useEffect(() => { onlineRef.current = online; });

  useEffect(() => {
    const live = onlineRef;
    // Proxy estable: el motor se crea una vez y los callbacks leen siempre lo último.
    const proxy = isOnline
      ? {
          guess: (text) => live.current.guess(text),
          loadAnswers: () => live.current.loadAnswers(),
          onScore: (n) => live.current.onScore && live.current.onScore(n),
          onReady: () => live.current.onReady && live.current.onReady(),
          errorText: (err) => (live.current.errorText ? live.current.errorText(err) : ''),
        }
      : undefined;
    const game = createGame({ country, texts, geoUrl, els: { ...els.current }, online: proxy });
    gameRef.current = game;
    if (isOnline) {
      game.setPhase(phaseRef.current);
      if (rivalRef.current) game.showRivalAnswers(rivalRef.current);
    }
    return () => {
      gameRef.current = null;
      game.destroy();
    };
  }, [country, texts, geoUrl, isOnline]);

  // Online: quien monta el juego manda la fase (cuenta atrás -> jugando -> terminado).
  useEffect(() => {
    phaseRef.current = phase;
    if (gameRef.current) gameRef.current.setPhase(phase);
  }, [phase]);

  // Online, partida terminada: pinta lo que acertó el rival.
  useEffect(() => {
    rivalRef.current = rivalIds;
    if (gameRef.current && rivalIds) gameRef.current.showRivalAnswers(rivalIds);
  }, [rivalIds]);

  // Los elementos cuyo texto/clases controla el motor (contadores, feedback, pista, toast,
  // pantalla de inicio y de resultado) se renderizan SIN hijos dinámicos:
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

        {/* Pantalla de inicio: la partida no empieza hasta pulsar «Empezar». En una partida online
          está siempre oculta (el motor no la abre) y los botones de abajo no se ven. */}
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

      {/* One box per name to guess: empty until guessed (the engine fills them). */}
      <div className="slots" ref={setEl('slots')} role="list" aria-label={texts.slotsLabel} />

      {/* Online: los botones del motor siguen aquí (los necesita) pero ocultos; la barra
          inferior solo muestra lo que pase quien monta la partida (`bottom`). */}
      <div className="bottom" style={isOnline && !bottom ? { display: 'none' } : undefined}>
        {bottom}
        <div className="left-actions" style={isOnline ? { display: 'none' } : undefined}>
          <button ref={setEl('giveUp')} className="secondary" type="button" disabled>{texts.giveUpLabel}</button>
          <button ref={setEl('viewResult')} className="secondary hidden" type="button">{texts.viewResultLabel}</button>
        </div>
        <div className="right-actions" style={isOnline ? { display: 'none' } : undefined}>
          <button ref={setEl('reset')} className="secondary" type="button">{texts.resetLabel}</button>
        </div>
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

export default memo(CountryGame);
