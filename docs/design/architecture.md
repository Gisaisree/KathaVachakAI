# KathaVachakAI — Architecture

> Scope: this document describes (1) the current *verified* architecture of the repository as-is and (2) a proposed target architecture to support the approved enhancements:
> 1) Story generation UX completion (display story + loading/error states)
> 2) Remove hard-coded ngrok URLs via env config and/or backend boundaries
> 3) Authentication end-to-end (Signup/Login UI, JWT, route protection)

This document does **not** implement changes; it is design guidance for review.

---

## 1. Project purpose (verified)
- Frontend provides a book-reading experience (PDF library) and a story-generation flow with optional audio readout.
- Backend provides user signup/login with JWT tokens and a protected example route.
- Story generation and text-to-speech (TTS) readout are integrated via two *external* hard-coded ngrok endpoints called directly from the frontend.

---

## 2. Verified technology stack

### Frontend (verified)
- React (CRA-style app, React 18)
- React Router DOM v6 (routes defined in `src/App.js`)

### Backend (verified)
- Node.js / Express (`backend/server.js`)
- MongoDB via Mongoose (connects to `process.env.MONGO_URI`)
- Auth: bcrypt password hashing + JWT via `jsonwebtoken`
- Config: `dotenv`
- CORS: `cors` middleware (configured to allow `http://localhost:3000` only)

---

## 3. Current architecture (verified)

### 3.1 Frontend routes and component responsibilities (verified)
- `/` → `src/Front.js`
  - Shows title and navigation to Read Books and Model.
- `/ReadBooks` → `src/ReadBooks.js`
  - Shows a grid of book cover images linking to PDFs under `public/pdfs`.
- `/Home` → `src/Home.js`
  - Collects prompt + genre + length (word count)
  - Calls external story-generation endpoint via ngrok (hard-coded)
  - Calls external TTS readout endpoint via ngrok (hard-coded)
  - Renders an `<audio>` player when an audio URL is returned
  - **Note (verified):** generated story text is stored in state but not rendered.

### 3.2 Backend services, auth, and API boundaries (verified)
- Express server listens on `PORT` default `6000`.
- User schema: `{ email, password }`.
- Routes:
  - `POST /api/signup`
    - Validates email format and enforces `email.endsWith("@gmail.com")`
    - Hashes password with bcrypt (salt rounds 12)
  - `POST /api/login`
    - Validates credentials, returns JWT token (expires in 1 hour)
  - `GET /api/protected`
    - Requires `Authorization: Bearer <token>`
  - `GET /` returns "API is running..."

### 3.3 Story-generation and TTS integrations (verified)
In `src/Home.js`:
- Story generation: `fetch("https://2fd9-34-126-156-31.ngrok-free.app/", { method: "POST", body: { input } })` and expects `data.story`.
- Readout: `fetch("https://e1d9-34-126-156-31.ngrok-free.app/readout", { method: "POST", body: { text } })` and expects `data.audioUrl`.

**Verified limitation:** Implementations of these services are not in this repository.

### 3.4 Current end-to-end data flow (verified)
1. User opens `/Home`.
2. User enters prompt, genre, word count.
3. Frontend builds a single prompt string and POSTs it to external story-generation ngrok URL.
4. Frontend stores `generatedStory` in state (not displayed).
5. User clicks “Play Readout”; frontend POSTs story text to external TTS ngrok URL.
6. Frontend renders `<audio controls>` for returned `audioUrl`.

---

## 4. Architectural gaps, hardcoded endpoint risks, external dependencies

### Verified gaps/defects
- Story text not displayed to user.
- Minimal user-facing error UX (mostly `console.error` and `alert`).
- No loading states; double-submit risk.
- Hard-coded ngrok URLs can expire or change; breaks core feature.
- Backend auth exists but frontend has no login/signup flow wired.

### External dependency risks (verified)
- External story/TTS endpoints: unknown SLAs, auth requirements, response schema stability.

---

## 5. Proposed target architecture (to support approved enhancements)

This proposes a minimal evolution that keeps the current stack and adds capabilities.

### 5.1 Key design principles (proposed)
- Environment-based configuration: no hard-coded service URLs.
- Prefer a single backend API boundary for the frontend.
- Clear loading/success/error states in UX.
- End-to-end authentication with JWT and route guards.

### 5.2 Proposed components (additions marked *Proposed*)
- *Proposed Frontend Auth UI*: implement `src/Login.js`, `src/SignUp.js` and add router paths.
- *Proposed Auth helper*: e.g. `src/auth/*` to store token and attach Authorization header.
- *Proposed ProtectedRoute*: React Router v6 route guard.
- *Proposed Backend proxy routes* (if chosen):
  - `POST /api/story/generate`
  - `POST /api/story/readout`

### 5.3 Mermaid architecture diagram (current vs target)

```mermaid
flowchart LR
  subgraph Current
    BR[Browser (React SPA)] -->|POST story| SG[[Story Gen Svc (ngrok)]]
    BR -->|POST readout| TTS[[TTS Svc (ngrok)]]
    BR -. auth not wired .-> BE[Express Backend (auth only)]
    BE --> MDB[(MongoDB)]
  end

  subgraph Proposed Target (recommended)
    BR2[Browser (React SPA)] -->|POST| API[Express API Boundary]
    API --> MDB2[(MongoDB users)]
    API -->|proxy generate| SG2[[Story Gen Svc (external)]]
    API -->|proxy readout| TTS2[[TTS Svc (external)]]
    BR2 -->|JWT stored + route guard| AUTH[Frontend auth state]
  end
```

*Note:* If the team chooses direct browser→service calls, replace proxy edges with env-configured direct endpoints.

---

## 6. Configuration and environment-variable strategy (proposed)

### 6.1 Frontend (proposed)
CRA variables:
- `REACT_APP_API_BASE_URL=http://localhost:6000`
- If not proxying via backend:
  - `REACT_APP_STORY_SERVICE_URL=...`
  - `REACT_APP_READOUT_SERVICE_URL=...`

If required vars are missing, show a configuration error state (don’t fail silently).

### 6.2 Backend (proposed)
Already required:
- `MONGO_URI=...`
- `JWT_SECRET=...`

If proxying:
- `STORY_SERVICE_URL=...`
- `READOUT_SERVICE_URL=...`

CORS:
- `CORS_ORIGIN=http://localhost:3000` (and prod domain as needed)

---

## 7. Security and reliability considerations

### 7.1 JWT auth (verified + proposed)
- Verified: JWT expires in 1 hour; backend expects `Authorization: Bearer <token>`.
- Proposed: frontend stores token (decision required: localStorage vs memory) and attaches header.

### 7.2 CORS (verified + proposed)
- Verified: CORS allows `http://localhost:3000` only and only `Content-Type` header.
- Proposed:
  - Make allowed origin configurable
  - Add `Authorization` to allowed headers (required for JWT)

### 7.3 Input validation (verified + proposed)
- Verified: frontend uses `alert` for empty fields; backend validates signup email and gmail-only.
- Proposed:
  - Frontend inline validation for prompt/genre/word count
  - If proxy routes added, validate body schema and enforce max payload sizes

### 7.4 Error handling, logging, availability (proposed)
- Frontend: user-visible errors + loading states.
- Backend: consistent error response shape `{ message }`.
- External services: timeouts and user-friendly fallback messaging.

---

## 8. Open questions (blockers)
1. Will we proxy story/TTS through backend (recommended) or call external services directly?
2. What are the guaranteed response schemas for story and readout services?
3. Is gmail-only signup intentional?
4. Token storage strategy?
