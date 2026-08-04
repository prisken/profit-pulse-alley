import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { buildDeterministicPyramidGuess } = await import(
    "../src/lib/workshop/ai-fallbacks"
  );
  const { callDeepSeek } = await import("../src/lib/workshop/deepseek-client");

  const fb = buildDeterministicPyramidGuess({
    age: 40,
    monthlyIncome: 25_000,
    industry: "finance",
  });
  console.log(
    "fallback_ok",
    fb.pyramid.goals.goals.length,
    fb.rationale.zhHant.slice(0, 24),
  );

  const started = Date.now();
  const raw = await callDeepSeek({
    systemPrompt: 'Reply with JSON only: {"ok": true}',
    userPrompt: "ping",
    jsonMode: true,
  });
  console.log("deepseek_ok", `${Date.now() - started}ms`, raw.slice(0, 80));
}

main().catch((error) => {
  console.error(
    "smoke_fail",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
