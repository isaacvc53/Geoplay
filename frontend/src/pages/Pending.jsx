import { Link } from 'react-router-dom';

// Placeholder for pages that haven't been migrated yet.
export default function Pending({ name }) {
  return (
    <div style={{ padding: 40, color: '#f3eee0', fontFamily: 'Space Mono, monospace' }}>
      <p>{name} — not migrated yet.</p>
      <Link to="/" style={{ color: '#e0bd7d' }}>← Home</Link>
    </div>
  );
}
