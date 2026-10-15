import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
});

test('renders the landing page heading and navigation', () => {
  render(<App />);
  expect(screen.getByText(/KathaVaachak/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /read books/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /go to model/i })).toBeInTheDocument();
});

test('unauthenticated access to /Home redirects to login with a message', () => {
  window.history.pushState({}, '', '/Home');
  render(<App />);
  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  expect(screen.getByText('Please log in to continue.')).toBeInTheDocument();
});
