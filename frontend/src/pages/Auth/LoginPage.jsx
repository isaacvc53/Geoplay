import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const { loggedIn, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get('expired') ? 'Your session expired. Please sign in again.' : '');

  if (loggedIn) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      if (err.status === 401) setError('Incorrect email or password.');
      else if (err.status === 429) setError('Too many attempts. Please wait a minute and try again.');
      else setError('Something went wrong. Please try again.');
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
        <h1>Sign in</h1>
        <p className="sub">Enter your account to track your progress and stats across every map.</p>
        <div className={'error' + (error ? ' show' : '')}>{error}</div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className="foot">New to Geotaria? <Link to="/register">Create an account</Link></div>
      </div>
    </div>
  );
}
