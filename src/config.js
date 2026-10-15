// Read at call time (not import time) so the value can be changed in tests.
export const getApiBaseUrl = () =>
  (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');
