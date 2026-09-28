import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function RegisterPage() {
  const { loggedIn, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loggedIn) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(email.trim(), username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.status === 400 ? 'That email or username is already taken.' : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className="card">
        <Link className="brand" to="/">
          <div className="mark">G</div>
          <span className="word">Geo<i>taria</i></span>
        </Link>
        <h1>Create account</h1>
        <p className="sub">Sign up to save your progress and see your stats across every map.</p>
        <div className={'error' + (error ? ' show' : '')}>{error}</div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input type="text" id="username" required minLength={3} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="hint">At least 8 characters.</div>
          </div>
          <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <div className="foot">Already have an account? <Link to="/login">Sign in</Link></div>
      </div>
    </div>
  );
}
