/**
 * Touch-simulation QA for workshop sliders / risk nudges / year scrubber.
 *
 * Uses the dev-only fixture at /workshop/pyramid/touch-fixture so QA does not
 * depend on DeepSeek latency. Playwright hasTouch + isMobile (not mouse-only).
 *
 * Usage: node scripts/workshop-touch-slider-qa.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium, devices } = require("playwright");

const BASE = process.env.WORKSHOP_BASE_URL || "http://localhost:3000";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices["iPhone 12"];
  const context = await browser.newContext({
    ...iPhone,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  const url = `${BASE}/workshop/pyramid/touch-fixture`;
  console.log(`[touch-qa] ${url} @ ${iPhone.viewport.width}px touch`);
  const res = await page.goto(url, { waitUntil: "networkidle" });
  assert(res && res.ok(), `fixture page HTTP ${res?.status()}`);
  await page.getByText("Workshop touch fixture").waitFor();

  // —— Medical coverage slider ——
  const medical = page.locator("#workshop-medical-coverage-slider");
  await medical.scrollIntoViewIfNeeded();
  const medicalCss = await medical.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      touchAction: cs.touchAction,
      height: cs.height,
      hasClass: el.classList.contains("workshop-range"),
    };
  });
  assert(medicalCss.hasClass, "medical slider missing workshop-range");
  assert(
    medicalCss.touchAction === "none",
    `medical touch-action=${medicalCss.touchAction}`,
  );
  assert(
    Number.parseFloat(medicalCss.height) >= 44,
    `medical height ${medicalCss.height}`,
  );
  console.log(
    `  OK  medical slider: touch-action=${medicalCss.touchAction} height=${medicalCss.height}`,
  );

  const medBox = await medical.boundingBox();
  assert(medBox, "medical box");
  const medBefore = Number(await medical.inputValue());
  await page.touchscreen.tap(
    medBox.x + medBox.width * 0.9,
    medBox.y + medBox.height / 2,
  );
  await page.waitForTimeout(150);
  const medAfter = Number(await medical.inputValue());
  assert(medAfter >= medBefore, `medical tap ${medBefore}→${medAfter}`);
  console.log(`  OK  medical tap-to-jump (touch): ${medBefore} → ${medAfter}`);

  // —— Risk @ 390px: percent + nudges, no slider ——
  await page.locator("#workshop-risk-low").scrollIntoViewIfNeeded();
  assert(await page.locator("#workshop-risk-low").isVisible(), "risk field");
  assert(
    !(await page.locator("#workshop-risk-low-slider").isVisible()),
    "risk slider should be hidden <400px",
  );

  const nudge = page.getByRole("button", {
    name: /Increase Low risk by 5%/i,
  });
  const nudgeBox = await nudge.boundingBox();
  assert(nudgeBox, "nudge box");
  assert(
    nudgeBox.width >= 44 && nudgeBox.height >= 44,
    `nudge ${JSON.stringify(nudgeBox)}`,
  );
  await nudge.tap();
  await page.waitForTimeout(100);
  console.log(
    `  OK  risk mobile: percent field + ${Math.round(nudgeBox.width)}x${Math.round(nudgeBox.height)} nudge; slider hidden`,
  );

  await page.setViewportSize({ width: 420, height: 812 });
  await page.waitForTimeout(200);
  assert(
    await page.locator("#workshop-risk-low-slider").isVisible(),
    "slider @420",
  );
  assert(
    !(await page.locator("#workshop-risk-low").isVisible()),
    "field hidden @420",
  );
  console.log("  OK  risk ≥400px: slider visible, percent field hidden");

  // —— Year scrubber ——
  await page.setViewportSize(iPhone.viewport);
  const scrubber = page
    .locator('[data-qa="scrubber"]')
    .getByRole("slider", { name: "Year scrubber" });
  await scrubber.evaluate((el) => {
    el.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await page.waitForTimeout(150);
  const scrubCss = await scrubber.evaluate((el) => {
    const parent = el.closest(".touch-none");
    const stepRoot = el.closest(".touch-pan-y");
    return {
      touchAction: getComputedStyle(el).touchAction,
      parentTouchNone: Boolean(parent),
      stepTouchPanY: Boolean(stepRoot),
    };
  });
  assert(scrubCss.touchAction === "none", `scrub touch-action`);
  assert(scrubCss.parentTouchNone, "scrub parent touch-none");
  assert(scrubCss.stepTouchPanY, "page touch-pan-y");
  console.log(
    "  OK  year scrubber: touch-action=none, wrapper touch-none, page touch-pan-y",
  );

  const scrubBox = await scrubber.boundingBox();
  assert(scrubBox, "scrub box");
  const y0 = Number(
    await page.locator('[data-qa="scrubber"] [data-testid="scrub-year"]').innerText(),
  );
  await scrubber.dispatchEvent("pointerdown", {
    button: 0,
    clientX: scrubBox.x + scrubBox.width * 0.85,
    clientY: scrubBox.y + scrubBox.height / 2,
    pointerId: 1,
    pointerType: "touch",
  });
  await scrubber.dispatchEvent("pointerup", {
    button: 0,
    clientX: scrubBox.x + scrubBox.width * 0.85,
    clientY: scrubBox.y + scrubBox.height / 2,
    pointerId: 1,
    pointerType: "touch",
  });
  await page.waitForTimeout(200);
  const y1 = Number(
    await page.locator('[data-qa="scrubber"] [data-testid="scrub-year"]').innerText(),
  );
  assert(y1 > y0, `scrub tap-to-jump ${y0}→${y1}`);
  console.log(`  OK  year scrubber tap-to-jump (touch): ${y0} → ${y1}`);

  console.log("[touch-qa] PASS");
  await browser.close();
}

main().catch((err) => {
  console.error("[touch-qa] FAIL", err);
  process.exit(1);
});
