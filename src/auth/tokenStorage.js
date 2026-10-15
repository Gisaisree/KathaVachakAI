const TOKEN_KEY = 'kathavachak_token';

// localStorage can throw (private mode, blocked site data), so every access is guarded.
export const getToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
};

export const setToken = (token) => {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    // Ignore: the user simply has to log in again next time.
  }
};

export const clearToken = () => {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    // Ignore.
  }
};
