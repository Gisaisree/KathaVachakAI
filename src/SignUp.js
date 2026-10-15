import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from './config';
import { parseJsonSafe } from './auth/authFetch';
import './Auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const trimmed = email.trim();
    if (!trimmed || !password || !confirm) return 'All fields are required.';
    // The backend currently only accepts Gmail addresses.
    if (!EMAIL_REGEX.test(trimmed) || !trimmed.endsWith('@gmail.com')) {
      return 'Email must be a valid Gmail address.';
    }
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
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
      const response = await fetch(`${baseUrl}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await parseJsonSafe(response);
      if (!response.ok) {
        setError((data && data.message) || 'Sign up failed. Please try again.');
        return;
      }
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Please log in.' },
      });
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>Sign Up</h1>
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
          autoComplete="new-password"
        />
        <label htmlFor="confirm">Confirm</label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
        />
        <div aria-live="polite">
          {error && <p className="auth-error" role="alert">{error}</p>}
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
};

export default SignUp;
