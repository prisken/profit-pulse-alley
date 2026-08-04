import { APIError } from "openai";
import { describe, expect, it } from "vitest";

import {
  isRetryableDeepSeekError,
  isTransientWorkshopAiError,
  stripMarkdownJsonFence,
} from "@/lib/workshop/deepseek-client";

describe("stripMarkdownJsonFence", () => {
  it("returns plain JSON unchanged", () => {
    expect(stripMarkdownJsonFence('{"a":1}')).toBe('{"a":1}');
  });

  it("strips json fences", () => {
    expect(stripMarkdownJsonFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("strips bare fences", () => {
    expect(stripMarkdownJsonFence("```\n{\"a\":1}\n```")).toBe('{"a":1}');
  });
});

describe("isRetryableDeepSeekError", () => {
  it("retries network-ish messages and empty responses", () => {
    expect(isRetryableDeepSeekError(new Error("fetch failed"))).toBe(true);
    expect(isRetryableDeepSeekError(new Error("socket hang up"))).toBe(true);
    expect(
      isRetryableDeepSeekError(
        new Error("DeepSeek returned an empty response."),
      ),
    ).toBe(true);
  });

  it("retries 429 and 5xx APIError", () => {
    expect(
      isRetryableDeepSeekError(
        new APIError(429, undefined, "rate limited", undefined),
      ),
    ).toBe(true);
    expect(
      isRetryableDeepSeekError(
        new APIError(503, undefined, "unavailable", undefined),
      ),
    ).toBe(true);
  });

  it("does not retry ordinary 4xx", () => {
    expect(
      isRetryableDeepSeekError(
        new APIError(400, undefined, "bad request", undefined),
      ),
    ).toBe(false);
    expect(
      isRetryableDeepSeekError(
        new APIError(401, undefined, "unauthorized", undefined),
      ),
    ).toBe(false);
  });
});

describe("isTransientWorkshopAiError", () => {
  it("treats missing API key as non-transient", () => {
    expect(
      isTransientWorkshopAiError(
        new Error("DEEPSEEK_API_KEY is missing. Set it in .env.local"),
      ),
    ).toBe(false);
  });

  it("treats invalid bilingual / JSON as transient (re-request)", () => {
    expect(
      isTransientWorkshopAiError(
        new Error('Invalid bilingual "rationale.zhHant": Traditional Chinese text is missing or empty.'),
      ),
    ).toBe(true);
    expect(
      isTransientWorkshopAiError(
        new Error("DeepSeek returned invalid JSON for pyramid prediction."),
      ),
    ).toBe(true);
  });
});
