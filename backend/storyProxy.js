// Proxy handlers for the external story-generation and TTS services.
// Kept free of express/mongoose imports so they can be unit-tested with plain mocks.

const MAX_INPUT_CHARS = 20000;   // prompt sent to the story service
const MAX_TEXT_CHARS = 100000;   // story text sent to the TTS service (10,000 words ~ 60k chars)
const DEFAULT_TIMEOUT_MS = 30000;

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const createStoryProxy = ({
  fetchImpl = (...args) => fetch(...args),
  getStoryUrl = () => process.env.STORY_SERVICE_URL,
  getReadoutUrl = () => process.env.READOUT_SERVICE_URL,
  timeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
} = {}) => {
  // POSTs JSON to the upstream service. Always resolves to { status, body }
  // so handlers only need to forward it; failures are mapped per the LLD:
  // 502 for upstream errors, 504 for timeouts.
  const callUpstream = async (url, payload, label) => {
    let response;
    try {
      response = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      if (err && (err.name === "TimeoutError" || err.name === "AbortError")) {
        return { status: 504, body: { message: `The ${label} service timed out.` } };
      }
      console.error(`${label} service request failed:`, err && err.message);
      return { status: 502, body: { message: `The ${label} service is unavailable.` } };
    }

    if (!response.ok) {
      console.error(`${label} service returned status ${response.status}`);
      return { status: 502, body: { message: `The ${label} service returned an error.` } };
    }

    try {
      return { status: 200, data: await response.json() };
    } catch (err) {
      return { status: 502, body: { message: `The ${label} service returned an invalid response.` } };
    }
  };

  const generate = async (req, res) => {
    const input = req.body && req.body.input;
    if (!isNonEmptyString(input)) {
      return res.status(400).json({ message: "Input is required." });
    }
    if (input.length > MAX_INPUT_CHARS) {
      return res.status(400).json({ message: `Input must be at most ${MAX_INPUT_CHARS} characters.` });
    }
    const url = getStoryUrl();
    if (!url) {
      return res.status(503).json({ message: "Story service is not configured." });
    }

    const result = await callUpstream(url, { input }, "story");
    if (result.body) return res.status(result.status).json(result.body);
    if (!result.data || !isNonEmptyString(result.data.story)) {
      return res.status(502).json({ message: "The story service returned an invalid response." });
    }
    return res.json({ story: result.data.story });
  };

  const readout = async (req, res) => {
    const text = req.body && req.body.text;
    if (!isNonEmptyString(text)) {
      return res.status(400).json({ message: "Text is required." });
    }
    if (text.length > MAX_TEXT_CHARS) {
      return res.status(400).json({ message: `Text must be at most ${MAX_TEXT_CHARS} characters.` });
    }
    const url = getReadoutUrl();
    if (!url) {
      return res.status(503).json({ message: "Readout service is not configured." });
    }

    const result = await callUpstream(url, { text }, "readout");
    if (result.body) return res.status(result.status).json(result.body);

    const audioUrl = result.data && result.data.audioUrl;
    if (!isNonEmptyString(audioUrl)) {
      return res.status(502).json({ message: "The readout service returned an invalid response." });
    }
    // Resolve relative URLs against the service and allow only http(s) links.
    let resolved;
    try {
      resolved = new URL(audioUrl, url);
    } catch (err) {
      return res.status(502).json({ message: "The readout service returned an invalid response." });
    }
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return res.status(502).json({ message: "The readout service returned an invalid response." });
    }
    return res.json({ audioUrl: resolved.href });
  };

  return { generate, readout };
};

// Builds cors() options from CORS_ORIGIN (comma-separated list).
const buildCorsOptions = (originEnv) => {
  const origins = (originEnv || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return {
    origin: origins.length === 1 ? origins[0] : origins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
};

module.exports = { createStoryProxy, buildCorsOptions, MAX_INPUT_CHARS, MAX_TEXT_CHARS };
