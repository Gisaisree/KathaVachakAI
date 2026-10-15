import { getToken, clearToken } from './tokenStorage';

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired. Please log in again.');
    this.name = 'SessionExpiredError';
  }
}

// Parses a JSON body, returning null when the body is empty or not JSON.
export const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
};

// fetch wrapper that attaches the JWT. A 401/403 clears the token and throws
// SessionExpiredError so callers can redirect to /login.
const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    clearToken();
    throw new SessionExpiredError();
  }
  return response;
};

export default authFetch;
