import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from './Login';
import SignUp from './SignUp';
import ProtectedRoute from './auth/ProtectedRoute';
import authFetch, { SessionExpiredError } from './auth/authFetch';
import { getToken, setToken } from './auth/tokenStorage';
import { getApiBaseUrl } from './config';

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const renderRoutes = (initial) =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/Home" element={<ProtectedRoute><div>secret home</div></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  process.env.REACT_APP_API_BASE_URL = 'http://api.test/';
  window.localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  delete process.env.REACT_APP_API_BASE_URL;
});

describe('config', () => {
  test('strips trailing slashes and defaults to empty', () => {
    expect(getApiBaseUrl()).toBe('http://api.test');
    delete process.env.REACT_APP_API_BASE_URL;
    expect(getApiBaseUrl()).toBe('');
  });
});

describe('ProtectedRoute', () => {
  test('redirects to /login when there is no token', () => {
    renderRoutes('/Home');
    expect(screen.queryByText('secret home')).not.toBeInTheDocument();
    expect(screen.getByText('Please log in to continue.')).toBeInTheDocument();
  });

  test('renders children when a token exists', () => {
    setToken('t');
    renderRoutes('/Home');
    expect(screen.getByText('secret home')).toBeInTheDocument();
  });
});

describe('Login', () => {
  test('requires both fields', async () => {
    renderRoutes('/login');
    userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Email and password are required.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('stores the token and redirects to /Home on success', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ message: 'Login successful.', token: 'jwt-abc' }));
    renderRoutes('/login');
    userEvent.type(screen.getByLabelText('Email'), 'a@gmail.com');
    userEvent.type(screen.getByLabelText('Password'), 'pw12345');
    userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('secret home')).toBeInTheDocument();
    expect(getToken()).toBe('jwt-abc');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('http://api.test/api/login');
    expect(JSON.parse(options.body)).toEqual({ email: 'a@gmail.com', password: 'pw12345' });
  });

  test('displays the backend error message and stores no token', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ message: 'Invalid credentials.' }, 401));
    renderRoutes('/login');
    userEvent.type(screen.getByLabelText('Email'), 'a@gmail.com');
    userEvent.type(screen.getByLabelText('Password'), 'wrong');
    userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Invalid credentials.')).toBeInTheDocument();
    expect(getToken()).toBeNull();
    expect(screen.getByRole('button', { name: /log in/i })).toBeEnabled();
  });

  test('shows a friendly message when the server is unreachable', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    renderRoutes('/login');
    userEvent.type(screen.getByLabelText('Email'), 'a@gmail.com');
    userEvent.type(screen.getByLabelText('Password'), 'pw');
    userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/could not reach the server/i)).toBeInTheDocument();
  });
});

describe('SignUp', () => {
  const fill = (email, password, confirm) => {
    userEvent.type(screen.getByLabelText('Email'), email);
    userEvent.type(screen.getByLabelText('Password'), password);
    userEvent.type(screen.getByLabelText('Confirm'), confirm);
    userEvent.click(screen.getByRole('button', { name: /create account/i }));
  };

  test('rejects mismatched passwords', async () => {
    renderRoutes('/signup');
    fill('a@gmail.com', 'pw1', 'pw2');
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('rejects non-Gmail addresses', async () => {
    renderRoutes('/signup');
    fill('a@example.com', 'pw1', 'pw1');
    expect(await screen.findByText('Email must be a valid Gmail address.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('redirects to login with a confirmation on success', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ message: 'singnup is successful' }, 201));
    renderRoutes('/signup');
    fill('a@gmail.com', 'pw1', 'pw1');
    expect(await screen.findByText('Account created. Please log in.')).toBeInTheDocument();
    expect(global.fetch.mock.calls[0][0]).toBe('http://api.test/api/signup');
  });

  test('displays backend errors such as duplicate email', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ message: 'Email already in use.' }, 400));
    renderRoutes('/signup');
    fill('a@gmail.com', 'pw1', 'pw1');
    expect(await screen.findByText('Email already in use.')).toBeInTheDocument();
  });
});

describe('authFetch', () => {
  test('attaches the bearer token', async () => {
    setToken('tok');
    global.fetch.mockResolvedValue(jsonResponse({}));
    await authFetch('http://x', { headers: { A: 'b' } });
    expect(global.fetch.mock.calls[0][1].headers).toEqual({ A: 'b', Authorization: 'Bearer tok' });
  });

  test('clears the token and throws on 401', async () => {
    setToken('tok');
    global.fetch.mockResolvedValue(jsonResponse({}, 401));
    await expect(authFetch('http://x')).rejects.toBeInstanceOf(SessionExpiredError);
    expect(getToken()).toBeNull();
  });
});
