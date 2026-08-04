/**
 * Verify WorkshopNumberField inputMode at 375px across intake → pyramid → expenses.
 *
 * Usage: node scripts/workshop-number-field-inputmode.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");

const BASE = process.env.WORKSHOP_BASE_URL || "http://localhost:3000";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function fieldMeta(locator) {
  return locator.evaluate((el) => {
    if (!(el instanceof HTMLInputElement)) {
      return null;
    }
    const style = window.getComputedStyle(el);
    return {
      type: el.type,
      inputMode: el.inputMode,
      enterKeyHint: el.enterKeyHint,
      fontSize: style.fontSize,
      id: el.id,
      ariaLabel: el.getAttribute("aria-label"),
    };
  });
}

async function expectNumericKeyboard(page, selector, expectedMode, label) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: "visible", timeout: 30_000 });
  await loc.scrollIntoViewIfNeeded();
  await loc.click({ timeout: 10_000 });
  const meta = await fieldMeta(loc);
  assert(meta, `${label}: not an input`);
  assert(meta.type === "text", `${label}: expected type=text, got ${meta.type}`);
  assert(
    meta.inputMode === expectedMode,
    `${label}: expected inputMode=${expectedMode}, got ${meta.inputMode}`,
  );
  const px = Number.parseFloat(meta.fontSize);
  assert(px >= 16, `${label}: font-size ${meta.fontSize} < 16px (iOS zoom risk)`);
  console.log(
    `  OK  ${label}: type=${meta.type} inputMode=${meta.inputMode} fontSize=${meta.fontSize} enterKeyHint=${meta.enterKeyHint || "(default)"}`,
  );
  // Blur so the next field focus is clean
  await page.keyboard.press("Tab");
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  console.log(`[inputmode-qa] ${BASE}/workshop/pyramid @ 375px`);
  await page.goto(`${BASE}/workshop/pyramid`, { waitUntil: "networkidle" });

  // Force English UI for stable selectors
  const enBtn = page.getByRole("button", { name: "English" });
  if (await enBtn.count()) {
    await enBtn.click();
    await page.waitForTimeout(300);
  }

  // —— Intake ——
  console.log("Step 1: intake");
  await page.getByRole("radio", { name: /Professional/i }).click();

  await expectNumericKeyboard(page, "#workshop-age", "numeric", "age");
  await page.locator("#workshop-age").click();
  await page.locator("#workshop-age").fill("32");
  // Commit blur so controlled value sticks
  await page.locator("#workshop-age").evaluate((el) => el.blur());

  await expectNumericKeyboard(page, "#workshop-income", "decimal", "monthly income");
  await page.locator("#workshop-income").click();
  await page.locator("#workshop-income").fill("65000");
  await page.locator("#workshop-income").evaluate((el) => el.blur());

  await page.getByRole("radio", { name: /^Tech$/i }).click();
  await page.locator("#workshop-household").selectOption({ index: 1 });

  const ageVal = await page.locator("#workshop-age").inputValue();
  const incomeVal = await page.locator("#workshop-income").inputValue();
  console.log(`  filled age="${ageVal}" income="${incomeVal}"`);

  await page.getByRole("button", { name: /Analyze my pyramid/i }).click();

  const step2 = page.getByText(/Step 2 of 8/).first();
  try {
    await step2.waitFor({ timeout: 180_000 });
  } catch (err) {
    const errText = await page.locator("[role='alert'], .text-red-300").allTextContents();
    const body = (await page.locator("body").innerText()).slice(0, 800);
    console.error("  intake failed. alerts:", errText);
    console.error("  body snippet:", body);
    throw err;
  }
  // —— Pyramid layers (all stacked; scroll into view) ——
  console.log("Step 2: pyramid");
  await expectNumericKeyboard(
    page,
    "#workshop-medical-coverage",
    "numeric",
    "medicalCoveragePercent",
  );
  await expectNumericKeyboard(
    page,
    "#workshop-critical-illness",
    "decimal",
    "criticalIllnessAmountHKD",
  );

  await page.locator("#workshop-emergency-saved").scrollIntoViewIfNeeded();
  await expectNumericKeyboard(
    page,
    "#workshop-emergency-saved",
    "decimal",
    "savedAmountHKD",
  );

  await page.locator('[id^="goal-amount-"]').first().scrollIntoViewIfNeeded();
  await expectNumericKeyboard(
    page,
    '[id^="goal-amount-"]',
    "decimal",
    "goal.targetAmountHKD",
  );
  await expectNumericKeyboard(
    page,
    '[id^="goal-year-"]',
    "numeric",
    "goal.targetYear",
  );

  await page.locator("#workshop-monthly-invest").scrollIntoViewIfNeeded();
  await expectNumericKeyboard(
    page,
    "#workshop-monthly-invest",
    "decimal",
    "monthlyInvestmentHKD",
  );
  await expectNumericKeyboard(
    page,
    "#workshop-monthly-fun",
    "decimal",
    "monthlyFunHKD",
  );

  // Advance to expenses
  await page.getByRole("button", { name: "Confirm My Pyramid" }).click();
  await page
    .getByText(/Step 3 of 8|第 3 步/)
    .first()
    .waitFor({ timeout: 180_000 });

  console.log("Step 3: expenses");
  await page
    .locator('input[inputmode="decimal"][type="text"]')
    .first()
    .waitFor({ state: "visible", timeout: 180_000 });

  // Expense fields have no fixed ids — take currency text inputs on this step.
  // Pyramid is gone; all decimal text inputs here are the 5 categories.
  const expenseInputs = page.locator('input[inputmode="decimal"][type="text"]');
  const n = await expenseInputs.count();
  assert(n >= 5, `expected ≥5 expense currency fields, got ${n}`);
  for (let i = 0; i < 5; i += 1) {
    const loc = expenseInputs.nth(i);
    await loc.scrollIntoViewIfNeeded();
    await loc.click();
    const meta = await fieldMeta(loc);
    assert(meta, `expense #${i + 1}: not an input`);
    assert(meta.type === "text", `expense #${i + 1}: type=${meta.type}`);
    assert(
      meta.inputMode === "decimal",
      `expense #${i + 1}: inputMode=${meta.inputMode}`,
    );
    const px = Number.parseFloat(meta.fontSize);
    assert(px >= 16, `expense #${i + 1}: font-size ${meta.fontSize} < 16px`);
    console.log(
      `  OK  expense category #${i + 1}: type=${meta.type} inputMode=${meta.inputMode} fontSize=${meta.fontSize}`,
    );
    await page.keyboard.press("Tab");
  }

  // Sanity: no leftover type=number in the workshop tree
  const leftover = await page.locator('input[type="number"]').count();
  assert(leftover === 0, `found ${leftover} leftover input[type=number]`);

  console.log("[inputmode-qa] PASS — all checked fields use numeric/decimal inputMode + ≥16px");
  await browser.close();
}

main().catch((err) => {
  console.error("[inputmode-qa] FAIL", err);
  process.exit(1);
});
