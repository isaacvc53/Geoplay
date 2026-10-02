import { useSyncExternalStore } from 'react';

// Sonidos del juego.
//
// Uso:   import { play } from '../lib/sound';   play('tick');   play('tick', { rate: 1.2 });
//
// Cada sonido tiene una versión SINTETIZADA (Web Audio, sin archivos) que suena por defecto.
// Si dejas un archivo con el mismo nombre en  src/assets/sounds/  (p. ej. `tick.mp3`), se usa
// ese en su lugar. Los nombres válidos están en SOUND_NAMES y en src/assets/sounds/README.md.
//
// Reglas del navegador: el audio no puede sonar hasta que el usuario haya interactuado con la
// página (clic, tecla, toque). Por eso el contexto de audio se crea en el primer gesto; antes de
// eso, play() no hace nada (y nunca lanza errores).

const STORAGE_KEY = 'geotaria:sound-muted';
const MASTER_VOLUME = 0.6;
const MIN_GAP_MS = 30; // el mismo sonido dos veces en menos de esto se ignora (p. ej. StrictMode)

// ---------------------------------------------------------------- archivos del usuario
// Vite resuelve esto al compilar: { '../assets/sounds/tick.mp3': '/assets/tick-abc123.mp3', ... }
const FILE_URLS = (() => {
  const found = import.meta.glob('../assets/sounds/*.{mp3,ogg,wav,m4a,webm}', {
    eager: true,
    query: '?url',
    import: 'default',
  });
  const byName = {};
  Object.keys(found).forEach((path) => {
    const name = path.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase();
    if (!(name in byName)) byName[name] = found[path];
  });
  return byName;
})();

// ---------------------------------------------------------------- silencio (guardado)
function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let muted = readMuted();
const listeners = new Set();

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = Boolean(value);
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // sin almacenamiento: vale solo para esta sesión
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Para componentes: const muted = useSoundMuted();
export function useSoundMuted() {
  return useSyncExternalStore(subscribe, () => muted, () => false);
}

// ---------------------------------------------------------------- contexto de audio
let ctx = null;
let master = null;
const buffers = {}; // nombre -> AudioBuffer ya decodificado (solo los que tienen archivo)

function decodeFiles() {
  Object.keys(FILE_URLS).forEach((name) => {
    fetch(FILE_URLS[name])
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error('no file'))))
      .then((data) => new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)))
      .then((buffer) => { buffers[name] = buffer; })
      .catch(() => {}); // si falla, se queda la versión sintetizada
  });
}

function createContext() {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
    decodeFiles();
  } catch {
    ctx = null;
  }
  return ctx;
}

// Primer gesto del usuario: crea (o despierta) el contexto de audio.
export function unlockSound() {
  const c = createContext();
  if (c && c.state !== 'running') c.resume().catch(() => {});
}

if (typeof window !== 'undefined') {
  const events = ['pointerdown', 'keydown', 'touchend'];
  const onGesture = () => {
    unlockSound();
    if (ctx && ctx.state === 'running') events.forEach((e) => window.removeEventListener(e, onGesture, true));
  };
  events.forEach((e) => window.addEventListener(e, onGesture, true));
}

// ---------------------------------------------------------------- bloques para sintetizar
// Una nota: oscilador + envolvente (ataque corto, caída exponencial).
function tone(freq, { at = 0, dur = 0.15, type = 'sine', gain = 0.3, to = null, attack = 0.004 } = {}) {
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  amp.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Secuencia de notas [freq, duración] una detrás de otra.
function melody(notes, opts = {}) {
  const { step = 0.1, ...rest } = opts;
  notes.forEach((freq, i) => tone(freq, { ...rest, at: (rest.at || 0) + i * step }));
}

// Notas (Hz)
const C4 = 261.63; const Eb4 = 311.13; const G4 = 392.0; const A4 = 440.0;
const C5 = 523.25; const E5 = 659.25; const G5 = 783.99; const A5 = 880.0;
const C6 = 1046.5; const D6 = 1174.66; const E6 = 1318.51;

// ---------------------------------------------------------------- los sonidos sintetizados
// Cada uno recibe `rate` (multiplica la frecuencia: sirve para subir el tono de los ticks).
const SYNTH = {
  // Un país se apaga en la ruleta: clic corto y seco.
  tick: (rate) => {
    tone(1250 * rate, { dur: 0.045, type: 'triangle', gain: 0.32 });
    tone(2500 * rate, { dur: 0.02, type: 'sine', gain: 0.1 });
  },
  // La ruleta se para en el país elegido: "ding" brillante con eco.
  land: () => {
    melody([G5, D6], { step: 0.11, dur: 0.5, type: 'sine', gain: 0.32 });
    melody([G5 * 2, D6 * 2], { step: 0.11, dur: 0.35, type: 'sine', gain: 0.08 });
  },
  // 3-2-1: pitido sobrio.
  countdown: () => tone(660, { dur: 0.16, type: 'sine', gain: 0.32 }),
  // "Go!": pitido más agudo y largo.
  go: () => {
    tone(990, { dur: 0.4, type: 'sine', gain: 0.34 });
    tone(1485, { dur: 0.4, type: 'triangle', gain: 0.12 });
  },
  // Rival encontrado: arpegio ascendente.
  'match-found': () => melody([C5, E5, G5, C6], { step: 0.085, dur: 0.22, type: 'triangle', gain: 0.28 }),
  // Acierto: "pling" de dos notas.
  correct: () => melody([A5, E6], { step: 0.07, dur: 0.16, type: 'sine', gain: 0.26 }),
  // Fallo: zumbido grave corto.
  wrong: () => tone(170, { dur: 0.2, type: 'sawtooth', gain: 0.12, to: 105 }),
  // El rival puntúa: toque suave, discreto.
  'rival-point': () => tone(A4, { dur: 0.12, type: 'triangle', gain: 0.14, to: 392 }),
  // Resultado final.
  win: () => {
    melody([C5, E5, G5, C6], { step: 0.11, dur: 0.28, type: 'triangle', gain: 0.3 });
    tone(C6, { at: 0.44, dur: 0.7, type: 'sine', gain: 0.28 });
    tone(E6, { at: 0.44, dur: 0.7, type: 'sine', gain: 0.12 });
  },
  lose: () => melody([G4, Eb4, C4], { step: 0.2, dur: 0.45, type: 'triangle', gain: 0.26 }),
  draw: () => melody([A4, A4], { step: 0.18, dur: 0.3, type: 'triangle', gain: 0.26 }),
};

export const SOUND_NAMES = Object.keys(SYNTH);

// ---------------------------------------------------------------- reproducir
const lastPlayed = {};

// name: uno de SOUND_NAMES · rate: velocidad/tono (1 = normal) · volume: 0..1 (solo archivos y
// como multiplicador extra)
export function play(name, { rate = 1, volume = 1 } = {}) {
  try {
    if (muted || !SYNTH[name] || !ctx) return; // sin gesto previo ctx es null: silencio
    if (ctx.state !== 'running') {
      ctx.resume().catch(() => {});
      return; // no se encolan sonidos "tarde"
    }
    const now = performance.now();
    if (now - (lastPlayed[name] || -Infinity) < MIN_GAP_MS) return;
    lastPlayed[name] = now;

    const buffer = buffers[name];
    if (buffer) {
      const src = ctx.createBufferSource();
      const amp = ctx.createGain();
      src.buffer = buffer;
      src.playbackRate.value = rate;
      amp.gain.value = volume;
      src.connect(amp);
      amp.connect(master);
      src.start();
    } else {
      SYNTH[name](rate);
    }
  } catch {
    // el sonido nunca debe romper el juego
  }
}
