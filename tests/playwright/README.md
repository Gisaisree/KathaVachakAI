# KathaVachaKAI – Playwright Tests

This directory contains automated end-to-end tests written in Playwright (not executed by this assistant).

## Notes about the app

- Routes: `/` (Front), `/ReadBooks`, `/login`, `/signup`, `/Home` (protected).
- `/Home` requires an auth token in localStorage (see src/auth/tokenStorage.js).
- Story generation and readout are network-dependent and should be mocked using Playwright's request routing.

## Running (if/when Playwright is added to the repo)

This repo does not currently ship Playwright configuration or dependencies. These scripts are generated as a starting point and are intended to be run after Playwright is installed and configured.

Example (for a CRA frontend):

- `npx playwright init` (creates playwright.config.*)
- `add @cross-env` or similar to set `REACT_APP_API_BASE_URL` in CI tests
- `npm run start` (or equivalent) in one terminal, `npx playwright test` in another
