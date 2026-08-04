import { useState } from 'react';
import './AdminLogin.css';
import api from '../api';
import appIcon from '../assets/app-icon.png';

export default function AdminLogin({ onLogin }) {
  const [tab, setTab] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setError('');
    setSuccess('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminData', JSON.stringify(response.data));
      onLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    reset();
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminData', JSON.stringify(response.data));
      onLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <img src={appIcon} alt="App Logo" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
          </div>
          <h1>Artisan Hunt</h1>
          <p>{tab === 'signin' ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); reset(); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); reset(); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} className="login-form">
          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          {tab === 'signup' && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading
              ? (tab === 'signin' ? 'Signing in…' : 'Creating account…')
              : (tab === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="auth-switch">
          {tab === 'signin' ? (
            <>Don't have an account?{' '}
              <button className="auth-switch-btn" type="button" onClick={() => { setTab('signup'); reset(); }}>
                Sign Up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button className="auth-switch-btn" type="button" onClick={() => { setTab('signin'); reset(); }}>
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
