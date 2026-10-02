import { unlockSound, useSoundMuted, setMuted, play } from '../lib/sound';
import './SoundToggle.css';

// Botón de sonido sí/no. Se acuerda de la elección (localStorage) y vale para toda la app.
export default function SoundToggle({ className = '' }) {
  const muted = useSoundMuted();

  function toggle() {
    unlockSound(); // este clic es un gesto del usuario: despierta el audio si hacía falta
    const next = !muted;
    setMuted(next);
    if (!next) play('correct'); // al activarlo suena una muestra, para que se note
  }

  return (
    <button
      type="button"
      className={`sound-toggle${muted ? ' off' : ''}${className ? ` ${className}` : ''}`}
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? 'Sound off. Turn on' : 'Sound on. Turn off'}
      title={muted ? 'Sound off' : 'Sound on'}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M4 9.5h3.5L12 5.8v12.4L7.5 14.5H4z" fill="currentColor" />
        {muted ? (
          <path d="M16 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <path d="M15.5 9a4 4 0 010 6m2.2-8.3a7.2 7.2 0 010 10.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
