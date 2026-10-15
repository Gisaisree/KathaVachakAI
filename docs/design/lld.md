# KathaVachakAI — Low-Level Design (LLD)

> This LLD references existing files and functions only where verified in the repository. Proposed additions are explicitly labeled **Proposed**.

## 1. Current modules and responsibilities (verified)

### 1.1 Frontend
- `src/App.js`
  - Defines routes: `/`, `/ReadBooks`, `/Home`.
- `src/Front.js`
  - Landing page with navigation.
- `src/ReadBooks.js`
  - Static list of books (`books` array) and mapping to PDF/image assets under `public/`.
- `src/Home.js`
  - Holds state: `storyPrompt`, `wordCount`, `genre`, `generatedStory`, `audioUrl`.
  - `handleSubmit(e)`
    - Validates fields (alerts if missing)
    - Builds input string
    - `fetch()` POST to hard-coded story URL
    - `setGeneratedStory(data.story)`
  - `playStoryReadout()`
    - Alerts if no story
    - `fetch()` POST to hard-coded TTS URL
    - `setAudioUrl(data.audioUrl)`

### 1.2 Backend
- `backend/server.js`
  - Express app setup, Mongo connect
  - CORS middleware
  - `authenticateToken(req,res,next)`
    - Reads `Authorization` header, expects `Bearer <token>`
    - Uses `jwt.verify(token, process.env.JWT_SECRET)`
  - Routes:
    - `POST /api/signup`
    - `POST /api/login`
    - `GET /api/protected` (JWT protected)

## 2. Proposed changes (LLD) mapped to enhancements

### Enhancement 1: Story generation UX completion

#### 2.1 `Home` UI rendering (existing file: `src/Home.js`)
**Change (proposed within existing component):**
- Render story text:
  - Add a section below buttons:
    - If `generatedStory` non-empty, show it in a scrollable panel.

**State additions (proposed):**
- `isGenerating: boolean`
- `isReadoutLoading: boolean`
- `error: string | null` (or `generateError`/`readoutError`)

**Behavior (proposed):**
- `handleSubmit`:
  - Validate prompt, genre, wordCount (ensure numeric and within bounds)
  - `setIsGenerating(true)`; clear errors
  - Call story endpoint
  - On success: set story + clear audioUrl (optional)
  - On failure: set error message
  - `finally`: set loading false

- `playStoryReadout`:
  - Disabled until story exists
  - `setIsReadoutLoading(true)`
  - Call readout endpoint
  - On success: set audioUrl
  - On failure: show error

**Error contract assumptions:**
- External services may return non-200 or non-JSON. Use a defensive `try/catch` and show generic error.

#### 2.2 Frontend validation messages (proposed)
Replace `alert()` with inline validation messages:
- Prompt required
- Genre required
- WordCount required and 100–10000

#### 2.3 Testing (existing file: `src/App.test.js`)
- Current CRA default test is likely failing (expects “learn react”).
- **Proposed:** update to assert the app renders expected text from `Front` (e.g., Katha-Vaachak or KathaVaachak).
- **Proposed:** add tests for `Home`:
  - Story renders after successful fetch
  - Loading disables buttons
  - Error message displays on fetch failure


### Enhancement 2: Remove hard-coded URLs via config

#### 2.4 Frontend configuration (proposed)
**Proposed utility:** `src/config.js`
- `export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;`
- Optionally:
  - `export const STORY_SERVICE_URL = process.env.REACT_APP_STORY_SERVICE_URL;`
  - `export const READOUT_SERVICE_URL = process.env.REACT_APP_READOUT_SERVICE_URL;`

**Home.js update (proposed):**
- Replace hard-coded URLs with config vars.

#### 2.5 Backend proxy endpoints (optional, Proposed)
If the team chooses proxying:
- Add in `backend/server.js` (or a new router file):
  - `POST /api/story/generate`
    - Request body: `{ input: string }`
    - Validations:
      - input exists, is string
      - max length (e.g., 20k chars) to prevent abuse
    - Calls `STORY_SERVICE_URL` using `fetch`/axios/node-fetch
    - Returns normalized `{ story: string }`

  - `POST /api/story/readout`
    - Request body: `{ text: string }`
    - Validations similar; max length enforced
    - Calls `READOUT_SERVICE_URL`
    - Returns normalized `{ audioUrl: string }`

**Timeout/retry (proposed):**
- Set a reasonable timeout for external calls (e.g., 15–30s)
- No retries by default; optionally retry once for idempotent generation calls

#### 2.6 CORS changes (proposed)
In `backend/server.js`:
- Make origin configurable via `process.env.CORS_ORIGIN`.
- Add `Authorization` to `allowedHeaders` so frontend can send JWT.


### Enhancement 3: Authentication end-to-end

#### 2.7 Frontend routes (existing file: `src/App.js`)
**Proposed routes:**
- `/login` → `src/Login.js`
- `/signup` → `src/SignUp.js`
- Protect `/Home` via `ProtectedRoute`.

#### 2.8 `src/Login.js` and `src/SignUp.js` (currently empty; Proposed implementation)

**Login component (proposed behavior):**
- Controlled inputs: email/password
- On submit:
  - POST `${API_BASE_URL}/api/login`
  - Handle errors and display messages
  - Store token on success

**Signup component (proposed behavior):**
- Controlled inputs: email/password/confirm password
- Client validation:
  - password match
  - optionally email format
  - Note: backend enforces gmail-only currently
- POST `${API_BASE_URL}/api/signup`

#### 2.9 Auth token handling (Proposed)
**Proposed file:** `src/auth/tokenStorage.js`
- `getToken(): string | null`
- `setToken(token: string): void`
- `clearToken(): void`

**Proposed file:** `src/auth/authFetch.js`
- wrapper around `fetch` adding `Authorization` header when token exists

**Storage decision:** open question (localStorage vs memory). For first iteration, localStorage is simplest.

#### 2.10 ProtectedRoute (Proposed)
**Proposed file:** `src/auth/ProtectedRoute.js`
- If token missing → redirect to `/login`
- Else → render children

#### 2.11 Backend JWT validation (verified)
- Already in `authenticateToken`.
- Ensure `allowedHeaders` includes `Authorization` (proposed).

## 3. Request/response contracts

### 3.1 Existing backend auth (verified)
- `POST /api/signup`
  - Request: `{ email: string, password: string }`
  - Response 201: `{ message: "singnup is successful" }`
  - Errors:
    - 400 missing fields `{ message: "All fields are required." }`
    - 400 invalid gmail `{ message: "Email must be a valid Gmail address." }`
    - 400 duplicate `{ message: "Email already in use." }`

- `POST /api/login`
  - Request: `{ email: string, password: string }`
  - Response 200: `{ message: "Login successful.", token: string }`

- `GET /api/protected`
  - Header: `Authorization: Bearer <token>`
  - Response 200: `{ message: string, user: { id, email, iat, exp } }`

### 3.2 Story/TTS contracts (assumptions; current frontend expectation)
- Story service: request `{ input: string }` → response `{ story: string }`
- Readout service: request `{ text: string }` → response `{ audioUrl: string }`

## 4. Error handling strategy (proposed)

### 4.1 Frontend
- Normalize errors into a single message displayed near action buttons.
- Use non-blocking inline messages instead of `alert()`.

### 4.2 Backend (if proxy endpoints are implemented)
- Return `{ message }` consistently.
- Map upstream failures to:
  - 502 Bad Gateway when external service errors
  - 504 Gateway Timeout on timeout

## 5. Testing considerations (proposed)

### 5.1 Unit/UI tests
- Update `App.test.js` to match actual UI.
- Add tests for:
  - Home generation success/error/loading
  - Login/signup validation and API call behaviors
  - ProtectedRoute redirect

### 5.2 Integration / e2e
- Basic smoke tests can be added later (e.g., Playwright/Cypress) if desired.

## 6. Known defects and proposed fixes (verified)
- Story not displayed: render `generatedStory`.
- Hard-coded URLs: replace with env-config.
- Empty auth components: implement and wire routes.
- Potentially failing default CRA test: update to match app.

## 7. Traceability matrix (gap → change → test)
| Gap / Risk | Proposed change | Test |
|---|---|---|
| Story not visible | Render story container in `Home` | UI test: story displayed |
| No loading state | `isGenerating` / `isReadoutLoading` and disabled buttons | UI test: disabled during pending |
| Hard-coded endpoints | Config module + env vars | Unit test: uses configured URL (mock) |
| Auth backend unused | Add login/signup UI + routes | UI test: login success stores token |
| Protected access needed | `ProtectedRoute` | UI test: redirect when no token |
