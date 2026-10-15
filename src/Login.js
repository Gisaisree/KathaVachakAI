import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from './config';
import { setToken } from './auth/tokenStorage';
import { parseJsonSafe } from './auth/authFetch';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state && location.state.message;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      setError('Configuration needed: set REACT_APP_API_BASE_URL.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await parseJsonSafe(response);
      if (!response.ok || !data || !data.token) {
        setError((data && data.message) || 'Login failed. Please try again.');
        return;
      }
      setToken(data.token);
      const from = location.state && location.state.from;
      navigate(from && from.pathname ? from.pathname : '/Home', { replace: true });
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>Login</h1>
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="current-password"
        />
        <div aria-live="polite">
          {error && <p className="auth-error" role="alert">{error}</p>}
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};

export default Login;
