# KathaVachakAI — Wireframes (text-based)

> These wireframes describe **current verified screens** and **proposed UI updates** needed for the approved enhancements. Nothing in this document implies the UI already exists unless labeled “Current (verified)”.

Legend:
- **[Current]** = verified in code today
- **[Proposed]** = part of approved enhancements

---

## 1) Landing / Main page (`/`) — Front

### Current (verified)
```
+-----------------------------------------------------+
|                 KathaVaachak                         |
|                                                     |
|      [ Read Books ]      [ Go to Model ]             |
|                                                     |
+-----------------------------------------------------+
```

**Interactions**
- Click **Read Books** → navigates to `/ReadBooks`
- Click **Go to Model** → navigates to `/Home`

### Proposed additions (optional)
- Add auth entry points if auth is enabled:
  - [Login] [Sign Up] buttons or links in header

---

## 2) Read Books (`/ReadBooks`) — PDF library

### Current (verified)
```
+-----------------------------------------------------+
| Header / Title                                       |
|                                                     |
|  [BookCard] [BookCard] [BookCard] [BookCard]        |
|  [cover]    [cover]    [cover]    [cover]           |
|   Title      Title      Title      Title            |
|                                                     |
|  ... (grid continues)                               |
+-----------------------------------------------------+
```

**Interactions (verified)**
- Clicking a book opens a PDF in a new tab (`target="_blank"`).

**Usability gaps (verified from data)**
- One book title appears malformed (string includes filename).

### Proposed (decision required)
- If `/ReadBooks` is protected by auth (not currently):
  - unauthenticated users should be redirected to `/login`.

---

## 3) Story generation (`/Home`) — Generate + Readout

### Current (verified structure)
```
+-----------------------------------------------------+
|                 Katha-Vaachak                        |
|-----------------------------------------------------|
| [ Textarea: "Enter your story prompt here..." ]      |
|                                                     |
| Genre:  [ dropdown ]                                |
| Length: [ word count number input ]                 |
|                                                     |
| [ Generate Story ]   [ Play Readout ]                |
|                                                     |
| (If audioUrl exists)                                |
|  [ audio player controls ]                          |
+-----------------------------------------------------+
```

**Current behavior (verified)**
- Generate sends formatted input to hard-coded external URL.
- Readout sends `generatedStory` to hard-coded external URL.
- Generated story text is not displayed.

### Proposed (enhanced UX)

#### 3.1 Default / empty state
```
+-----------------------------------------------------+
| Katha-Vaachak                                       |
|-----------------------------------------------------|
| Prompt: [....................]                      |
| Genre:  [v]  Length: [____]                         |
|                                                     |
| [ Generate Story ]   [ Play Readout (disabled) ]     |
|                                                     |
| (No story yet)                                      |
+-----------------------------------------------------+
```

**Validation messages (proposed)**
- If prompt empty: “Prompt is required.”
- If genre not selected: “Please select a genre.”
- If wordCount missing/out of range: “Length must be between 100 and 10000 words.”

#### 3.2 Loading state (Generate)
```
| [ Generate Story (disabled) ]  [ Play Readout (disabled) ]
| Generating story… please wait                          |
```

#### 3.3 Success state (Story visible)
```
+-----------------------------------------------------+
| Generated Story                                     |
|-----------------------------------------------------|
| [Scrollable story text panel]                        |
|  Once upon a time...                                 |
|  ...                                                 |
|                                                     |
| [ Play Readout ]                                     |
+-----------------------------------------------------+
```

#### 3.4 Loading state (Readout)
```
| [ Play Readout (disabled) ]                          |
| Creating audio…                                      |
```

#### 3.5 Audio ready
```
| Audio                                                |
| [ audio controls: play/pause/seek ]                  |
```

#### 3.6 Failure states
- Story generation fails:
  - Show banner: “Story generation failed. Check configuration or try again.”
- Readout fails:
  - Show banner: “Audio generation failed. You can still read the story.”

**Error recovery (proposed)**
- “Try again” by re-enabling buttons.
- Keep story text displayed even if readout fails.

---

## 4) Login (`/login`) — New UI

### Proposed
```
+-----------------------------------------------------+
| Login                                               |
|-----------------------------------------------------|
| Email:    [________________________]                |
| Password: [________________________]                |
|                                                     |
| [ Log in ]                                          |
|                                                     |
| "Don't have an account? Sign up" (link)             |
+-----------------------------------------------------+
```

**Validation (proposed)**
- Required fields.
- Display backend error messages such as “Invalid credentials.”

**Loading (proposed)**
- Disable submit button while request is pending.

**Success (proposed)**
- Store JWT and redirect to `/Home`.

---

## 5) Sign Up (`/signup`) — New UI

### Proposed
```
+-----------------------------------------------------+
| Sign Up                                             |
|-----------------------------------------------------|
| Email:    [________________________]                |
| Password: [________________________]                |
| Confirm:  [________________________]                |
|                                                     |
| [ Create account ]                                  |
|                                                     |
| "Already have an account? Log in" (link)           |
+-----------------------------------------------------+
```

**Validation (proposed)**
- Passwords must match.
- Note: backend currently requires `@gmail.com`. UI should surface: “Email must be a valid Gmail address.”

**Success (proposed)**
- Show confirmation and redirect to login.

---

## 6) Protected route behavior

### Proposed: Unauthorized access to `/Home`
```
Attempt to open /Home without a token
  -> Redirect to /login
  -> Message: "Please log in to continue."
```

### Proposed: Expired/invalid token
- If backend returns 401/403:
  - Clear stored token
  - Redirect to `/login`
  - Message: “Session expired. Please log in again.”

---

## 7) Missing external services / configuration

### Proposed: Configuration error state
If required API URLs are not configured (or proxy is unreachable):
```
+-----------------------------------------------------+
| Configuration needed                                |
|-----------------------------------------------------+
| Story service is not configured.                     |
| Set REACT_APP_API_BASE_URL (and/or service URLs).    |
|                                                     |
| [ Retry ]                                            |
+-----------------------------------------------------+
```

---

## 8) Accessibility and usability notes (proposed)
- Use inline error text with `aria-live="polite"` for status updates.
- Ensure buttons have clear disabled states.
- Keep story panel readable (font size, spacing, `white-space: pre-wrap`).
