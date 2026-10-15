// Run with: node --test backend/
const test = require("node:test");
const assert = require("node:assert/strict");
const { createStoryProxy, buildCorsOptions, MAX_INPUT_CHARS, MAX_TEXT_CHARS } = require("./storyProxy");

const mockRes = () => {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
};

const upstream = (status, body) => async () => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => {
    if (body instanceof Error) throw body;
    return body;
  },
});

const proxyWith = (fetchImpl, overrides = {}) =>
  createStoryProxy({
    fetchImpl,
    getStoryUrl: () => "http://story.test/",
    getReadoutUrl: () => "http://tts.test/readout",
    timeoutMs: 1000,
    ...overrides,
  });

test("generate returns the normalized story", async () => {
  let call;
  const proxy = proxyWith(async (url, opts) => {
    call = { url, opts };
    return upstream(200, { story: "Once upon a time", extra: "ignored" })();
  });
  const res = mockRes();
  await proxy.generate({ body: { input: "write" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { story: "Once upon a time" });
  assert.equal(call.url, "http://story.test/");
  assert.deepEqual(JSON.parse(call.opts.body), { input: "write" });
});

test("generate validates input", async () => {
  const proxy = proxyWith(upstream(200, { story: "x" }));
  for (const body of [undefined, {}, { input: 5 }, { input: "   " }, { input: "a".repeat(MAX_INPUT_CHARS + 1) }]) {
    const res = mockRes();
    await proxy.generate({ body }, res);
    assert.equal(res.statusCode, 400, JSON.stringify(body)?.slice(0, 40));
    assert.ok(res.body.message);
  }
});

test("generate returns 503 when the story service is not configured", async () => {
  const proxy = proxyWith(upstream(200, { story: "x" }), { getStoryUrl: () => undefined });
  const res = mockRes();
  await proxy.generate({ body: { input: "hi" } }, res);
  assert.equal(res.statusCode, 503);
});

test("generate maps upstream errors and bad payloads to 502", async () => {
  const cases = [
    upstream(500, {}),
    upstream(200, { nope: true }),
    upstream(200, { story: "" }),
    upstream(200, new SyntaxError("not json")),
    async () => { throw new TypeError("connection refused"); },
  ];
  const origError = console.error;
  console.error = () => {};
  try {
    for (const fetchImpl of cases) {
      const res = mockRes();
      await proxyWith(fetchImpl).generate({ body: { input: "hi" } }, res);
      assert.equal(res.statusCode, 502);
    }
  } finally {
    console.error = origError;
  }
});

test("generate maps timeouts to 504", async () => {
  const proxy = proxyWith(async () => {
    const err = new Error("timed out");
    err.name = "TimeoutError";
    throw err;
  });
  const res = mockRes();
  await proxy.generate({ body: { input: "hi" } }, res);
  assert.equal(res.statusCode, 504);
});

test("readout returns the audio URL, resolving relative URLs against the service", async () => {
  const res = mockRes();
  await proxyWith(upstream(200, { audioUrl: "/files/a.mp3" })).readout({ body: { text: "hello" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { audioUrl: "http://tts.test/files/a.mp3" });

  const abs = mockRes();
  await proxyWith(upstream(200, { audioUrl: "https://cdn.test/a.mp3" })).readout({ body: { text: "hello" } }, abs);
  assert.deepEqual(abs.body, { audioUrl: "https://cdn.test/a.mp3" });
});

test("readout rejects non-http(s) audio URLs", async () => {
  const res = mockRes();
  await proxyWith(upstream(200, { audioUrl: "javascript:alert(1)" })).readout({ body: { text: "hello" } }, res);
  assert.equal(res.statusCode, 502);
});

test("readout validates text and configuration", async () => {
  const proxy = proxyWith(upstream(200, { audioUrl: "http://a/b.mp3" }));
  for (const body of [undefined, {}, { text: 1 }, { text: "a".repeat(MAX_TEXT_CHARS + 1) }]) {
    const res = mockRes();
    await proxy.readout({ body }, res);
    assert.equal(res.statusCode, 400);
  }
  const res = mockRes();
  await proxyWith(upstream(200, {}), { getReadoutUrl: () => "" }).readout({ body: { text: "hi" } }, res);
  assert.equal(res.statusCode, 503);
});

test("readout maps upstream failures to 502", async () => {
  const origError = console.error;
  console.error = () => {};
  try {
    const res = mockRes();
    await proxyWith(upstream(500, {})).readout({ body: { text: "hi" } }, res);
    assert.equal(res.statusCode, 502);
    const bad = mockRes();
    await proxyWith(upstream(200, {})).readout({ body: { text: "hi" } }, bad);
    assert.equal(bad.statusCode, 502);
  } finally {
    console.error = origError;
  }
});

test("buildCorsOptions defaults, parses lists and allows Authorization", () => {
  const def = buildCorsOptions(undefined);
  assert.equal(def.origin, "http://localhost:3000");
  assert.ok(def.allowedHeaders.includes("Authorization"));
  assert.deepEqual(buildCorsOptions("http://a.test, http://b.test").origin, ["http://a.test", "http://b.test"]);
});
