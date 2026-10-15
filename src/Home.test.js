import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Home from './Home';
import { getToken, setToken } from './auth/tokenStorage';

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/Home']}>
      <Routes>
        <Route path="/Home" element={<Home />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  );

const fillForm = ({ prompt = 'a brave fox', genre = 'moral', words = '200' } = {}) => {
  if (prompt) userEvent.type(screen.getByLabelText(/story prompt/i), prompt);
  if (genre) userEvent.selectOptions(screen.getByLabelText('Genre'), genre);
  if (words) userEvent.type(screen.getByLabelText('Length'), words);
};

beforeEach(() => {
  process.env.REACT_APP_API_BASE_URL = 'http://api.test';
  window.localStorage.clear();
  setToken('jwt-123');
  global.fetch = jest.fn();
});

afterEach(() => {
  delete process.env.REACT_APP_API_BASE_URL;
});

test('readout button is disabled until a story exists', () => {
  renderHome();
  expect(screen.getByRole('button', { name: /play readout/i })).toBeDisabled();
});

test('shows inline validation messages instead of alerts', async () => {
  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  renderHome();
  userEvent.click(screen.getByRole('button', { name: /generate story/i }));
  expect(await screen.findByText('Prompt is required.')).toBeInTheDocument();
  expect(screen.getByText('Please select a genre.')).toBeInTheDocument();
  expect(screen.getByText('Length must be between 100 and 10000 words.')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(alertSpy).not.toHaveBeenCalled();
});

test('rejects word counts outside 100-10000', async () => {
  renderHome();
  fillForm({ words: '50' });
  userEvent.click(screen.getByRole('button', { name: /generate story/i }));
  expect(await screen.findByText('Length must be between 100 and 10000 words.')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('renders the story after a successful generation using the configured URL and JWT', async () => {
  global.fetch.mockResolvedValue(jsonResponse({ story: 'Once upon a time...' }));
  renderHome();
  fillForm();
  userEvent.click(screen.getByRole('button', { name: /generate story/i }));

  expect(await screen.findByTestId('story-text')).toHaveTextContent('Once upon a time...');
  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe('http://api.test/api/story/generate');
  expect(options.headers.Authorization).toBe('Bearer jwt-123');
  expect(JSON.parse(options.body).input).toMatch(/moral story about a brave fox in 200 words/);
  expect(screen.getByRole('button', { name: /play readout/i })).toBeEnabled();
});

test('disables buttons and shows progress while generating', async () => {
  let resolveFetch;
  global.fetch.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
  renderHome();
  fillForm();
  userEvent.click(screen.getByRole('button', { name: /generate story/i }));

  expect(await screen.findByText(/generating story… please wait/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /generating…/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /play readout/i })).toBeDisabled();

  resolveFetch(jsonResponse({ story: 'Done.' }));
  expect(await screen.findByTestId('story-text')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /generate story/i })).toBeEnabled();
});

test('does not submit twice while a request is pending', async () => {
  let resolveFetch;
  global.fetch.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
  renderHome();
  fillForm();
  const form = screen.getByRole('button', { name: /generate story/i }).closest('form');
  userEvent.click(screen.getByRole('button', { name: /generate story/i }));
  await screen.findByText(/please wait/i);
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  resolveFetch(jsonResponse({ story: 'x' }));
  await screen.findByTestId('story-text');
});

test('shows an error and re-enables actions when generation fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch.mockResolvedValue(jsonResponse({ message: 'boom' }, 502));
  renderHome();
  fillForm();
  userEvent.click(screen.getByRole('button', { name: /generate story/i }));

  expect(await screen.findByText(/story generation failed/i)).toBeInTheDocument();
  expect(screen.queryByTestId('story-text')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /generate story/i })).toBeEnabled();
});

test('shows an error when the response is not valid JSON', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => { throw new SyntaxError('bad json'); },
  });
  renderHome();
  fillForm();
  userEvent.click(screen.getByRole('button', { name: /generate story/i }));
  expect(await screen.findByText(/story generation failed/i)).toBeInTheDocument();
});

test('readout shows an audio player on success', async () => {
  global.fetch
    .mockResolvedValueOnce(jsonResponse({ story: 'A story.' }))
    .mockResolvedValueOnce(jsonResponse({ audioUrl: 'http://audio.test/a.mp3' }));
  const { container } = renderHome();
  fillForm();
  userEvent.click(screen.getByRole('button', { name: /generate story/i }));
  await screen.findByTestId('story-text');

  userEvent.click(screen.getByRole('button', { name: /play readout/i }));
  await waitFor(() => expect(container.querySelector('audio')).toBeInTheDocument());
  expect(container.querySelector('audio')).toHaveAttribute('src', 'http://audio.test/a.mp3');
  expect(global.fetch.mock.calls[1][0]).toBe('http://api.test/api/story/readout');
});

test('readout failure keeps the story visible', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch
    .mockResolvedValueOnce(jsonResponse({ story: 'A story.' }))
    .mockResolvedValueOnce(jsonResponse({ message: 'nope' }, 502));
  renderHome();
  fillForm();
  userEvent.click(screen.getByRole('button', { name: /generate story/i }));
  await screen.findByTestId('story-text');

  userEvent.click(screen.getByRole('button', { name: /play readout/i }));
  expect(await screen.findByText(/audio generation failed/i)).toBeInTheDocument();
  expect(screen.getByTestId('story-text')).toHaveTextContent('A story.');
});

test('an expired session clears the token and redirects to login', async () => {
  global.fetch.mockResolvedValue(jsonResponse({ message: 'Invalid token.' }, 403));
  renderHome();
  fillForm();
  userEvent.click(screen.getByRole('button', { name: /generate story/i }));
  expect(await screen.findByText('login page')).toBeInTheDocument();
  expect(getToken()).toBeNull();
});

test('shows a configuration error when the API base URL is missing', () => {
  delete process.env.REACT_APP_API_BASE_URL;
  renderHome();
  expect(screen.getByText(/story service is not configured/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /generate story/i })).toBeDisabled();
});
