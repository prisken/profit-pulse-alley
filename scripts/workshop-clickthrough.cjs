/**
 * Local smoke click-through for Workshop Pyramid Lab (8 steps).
 * Usage:
 *   npx playwright install chromium
 *   npm i -D playwright
 *   node scripts/workshop-clickthrough.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports -- Node CJS smoke script */
const { chromium } = require("playwright");

const BASE = process.env.WORKSHOP_BASE_URL || "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(120_000);

  const log = (msg) => console.log(`[workshop] ${msg}`);

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[browser:error] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    console.log(`[pageerror] ${err.message}`);
  });

  await page.goto(`${BASE}/workshop/pyramid`, { waitUntil: "domcontentloaded" });
  await page.getByText("Step 1 of 8").first().waitFor();
  log("intake loaded · Step 1 of 8");

  await page.getByRole("radio", { name: /Professional/i }).click();
  await page.locator("#workshop-age").fill("32");
  await page.locator("#workshop-income").fill("65000");
  await page.locator("#workshop-industry").fill("Tech");
  await page.locator("#workshop-household").selectOption("Single");

  await page.getByRole("button", { name: /Analyze my pyramid/i }).click();
  log("submitted intake — waiting for pyramid…");

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (await page.getByText("Step 2 of 8").first().isVisible().catch(() => false)) {
      break;
    }
    const alerts = page.getByRole("alert");
    const count = await alerts.count();
    for (let i = 0; i < count; i += 1) {
      const msg = (await alerts.nth(i).innerText()).trim();
      if (msg.length > 0) {
        await page.screenshot({ path: "/tmp/workshop-fail.png", fullPage: true });
        throw new Error(`Intake alert: ${msg}`);
      }
    }
    const body = await page.locator("body").innerText();
    if (/Couldn.?t analyze your profile|DEEPSEEK_API_KEY is missing|Database client is outdated/i.test(body)) {
      await page.screenshot({ path: "/tmp/workshop-fail.png", fullPage: true });
      throw new Error(`Intake failed body match:\n${body.slice(0, 1500)}`);
    }
    await page.waitForTimeout(750);
  }
  if (!(await page.getByText("Step 2 of 8").first().isVisible().catch(() => false))) {
    const body = await page.locator("body").innerText();
    await page.screenshot({ path: "/tmp/workshop-fail.png", fullPage: true });
    throw new Error(`Timed out waiting for Step 2 of 8.\n${body.slice(0, 1500)}`);
  }
  log("pyramid · Step 2 of 8");

  await page.getByRole("button", { name: /Confirm My Pyramid/i }).click();
  await page.getByText("Step 3 of 8").first().waitFor({ timeout: 120_000 });
  log("expenses · Step 3 of 8");

  await page.getByRole("button", { name: /Confirm Expenses/i }).waitFor({
    timeout: 120_000,
  });
  await page.getByRole("button", { name: /Confirm Expenses/i }).click();
  await page.getByText("Step 4 of 8").first().waitFor({ timeout: 180_000 });
  log("stresstest · Step 4 of 8");

  await page
    .getByRole("button", { name: /See My Crisis Test/i })
    .waitFor({ timeout: 180_000 });
  await page.getByRole("button", { name: /See My Crisis Test/i }).click();
  await page.getByText("Step 5 of 8").first().waitFor({ timeout: 30_000 });
  log("riskquiz · Step 5 of 8");

  for (let q = 0; q < 5; q += 1) {
    await page.getByRole("radio").first().click();
    if (q === 4) {
      await page.getByRole("button", { name: "See My Crisis Test", exact: true }).click();
    } else {
      await page.getByRole("button", { name: "Next", exact: true }).click();
    }
  }
  await page.getByText("Step 6 of 8").first().waitFor({ timeout: 180_000 });
  log("crisis · Step 6 of 8");

  await page.getByRole("button", { name: /See My Summary/i }).click();
  await page.getByText("Step 7 of 8").first().waitFor({ timeout: 180_000 });
  log("summary · Step 7 of 8");

  await page.getByRole("button", { name: /Get My Blueprint/i }).click();
  await page.getByText("Step 8 of 8").first().waitFor({ timeout: 30_000 });
  log("capture · Step 8 of 8");

  await page.getByRole("button", { name: /^Back$/i }).click();
  await page.getByText("Step 7 of 8").first().waitFor();
  log("back-nav summary ok");

  await browser.close();
  log("FULL CLICK-THROUGH PASSED (8/8)");
}

main().catch(async (err) => {
  console.error("[workshop] CLICK-THROUGH FAILED:", err);
  process.exit(1);
});
