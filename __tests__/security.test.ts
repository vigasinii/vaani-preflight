import { describe, it, expect, vi, beforeEach } from "vitest";

// Tests for auth logic and rate limiting - verifiable without a running server.

describe("isAuthenticated", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns false when OWNER_SECRET is not set", async () => {
    vi.stubEnv("OWNER_SECRET", "");
    const { isAuthenticated } = await import("@/lib/auth");
    const req = { cookies: { get: () => ({ value: "any-value" }) } } as never;
    expect(isAuthenticated(req)).toBe(false);
  });

  it("returns false when cookie is missing", async () => {
    vi.stubEnv("OWNER_SECRET", "my-secret");
    const { isAuthenticated } = await import("@/lib/auth");
    const req = { cookies: { get: () => undefined } } as never;
    expect(isAuthenticated(req)).toBe(false);
  });

  it("returns false when cookie value does not match secret", async () => {
    vi.stubEnv("OWNER_SECRET", "correct-secret");
    const { isAuthenticated } = await import("@/lib/auth");
    const req = { cookies: { get: () => ({ value: "wrong-secret" }) } } as never;
    expect(isAuthenticated(req)).toBe(false);
  });

  it("returns true when cookie matches OWNER_SECRET", async () => {
    vi.stubEnv("OWNER_SECRET", "correct-secret");
    const { isAuthenticated } = await import("@/lib/auth");
    const req = { cookies: { get: () => ({ value: "correct-secret" }) } } as never;
    expect(isAuthenticated(req)).toBe(true);
  });
});

describe("rateLimit", () => {
  beforeEach(() => { vi.resetModules(); });

  it("allows requests up to the limit", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `test-${Date.now()}`;
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
  });

  it("blocks requests beyond the limit within the window", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `test-${Date.now()}-b`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    expect(rateLimit(key, 2, 60_000)).toBe(false);
  });

  it("uses different buckets for different keys", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const a = `key-a-${Date.now()}`;
    const b = `key-b-${Date.now()}`;
    rateLimit(a, 1, 60_000);
    // key a is now exhausted, key b should still be allowed
    expect(rateLimit(a, 1, 60_000)).toBe(false);
    expect(rateLimit(b, 1, 60_000)).toBe(true);
  });
});

describe("Scoring - no secrets in output", () => {
  it("score computation contains no API key or credentials", async () => {
    const { runRules } = await import("@/lib/preflight/rules");
    const { computeScore } = await import("@/lib/preflight/scoring");
    const { DEMO_FIXTURE } = await import("@/lib/demo-fixtures");
    const rules = runRules(DEMO_FIXTURE);
    const score = computeScore(rules);
    const output = JSON.stringify({ score, rules });
    expect(output).not.toContain("vaani_");
    expect(output).not.toContain("OWNER_SECRET");
    expect(output).not.toContain("api_key");
  });
});

describe("call_id validation regex", () => {
  const CALL_ID_RE = /^[a-zA-Z0-9_\-]{1,100}$/;

  it("accepts valid room name formats", () => {
    expect(CALL_ID_RE.test("room-abc123")).toBe(true);
    expect(CALL_ID_RE.test("vaani_room_2024")).toBe(true);
    expect(CALL_ID_RE.test("ABC-xyz-123")).toBe(true);
  });

  it("rejects path traversal and injection attempts", () => {
    expect(CALL_ID_RE.test("../secret")).toBe(false);
    expect(CALL_ID_RE.test("room; DROP TABLE")).toBe(false);
    expect(CALL_ID_RE.test("room\ninjection")).toBe(false);
    expect(CALL_ID_RE.test("")).toBe(false);
  });

  it("rejects strings over 100 characters", () => {
    expect(CALL_ID_RE.test("a".repeat(101))).toBe(false);
    expect(CALL_ID_RE.test("a".repeat(100))).toBe(true);
  });
});

describe("Demo fixture - evidence labeling", () => {
  it("DEMO_FIXTURE score is below 70 - correctly shows 'problem state'", async () => {
    const { DEMO_FIXTURE } = await import("@/lib/demo-fixtures");
    const { runRules } = await import("@/lib/preflight/rules");
    const { computeScore } = await import("@/lib/preflight/scoring");
    const score = computeScore(runRules(DEMO_FIXTURE));
    expect(score).toBeLessThan(70);
  });

  it("DEMO_FIXTURE has at least one critical finding", async () => {
    const { DEMO_FIXTURE } = await import("@/lib/demo-fixtures");
    const { runRules } = await import("@/lib/preflight/rules");
    const rules = runRules(DEMO_FIXTURE);
    const criticalFails = rules.filter(r => r.severity === "critical" && !r.passed);
    expect(criticalFails.length).toBeGreaterThanOrEqual(1);
  });
});
