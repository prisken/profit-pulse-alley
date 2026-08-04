/**
 * Responsive + CJK overflow QA for Workshop Pyramid Lab.
 *
 * Widths: 360 (Galaxy), 375 (iPhone SE), 390 (iPhone 12/14), 428 (14 Pro Max)
 * Locale: zh-Hant
 *
 * Usage: node scripts/workshop-responsive-cjk-qa.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");

const BASE = process.env.WORKSHOP_BASE_URL || "http://localhost:3000";
const WIDTHS = [360, 375, 390, 428];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function setZhHant(page) {
  await page.context().addCookies([
    {
      name: "ppa_locale",
      value: "zh-Hant",
      url: BASE,
    },
  ]);
}

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const pageScroll =
      Math.max(doc.scrollWidth, body.scrollWidth) >
      Math.max(doc.clientWidth, body.clientWidth) + 1;

    const offenders = [];
    const nodes = document.querySelectorAll(
      "h1, h2, h3, p, span, button, label, input, [data-qa] article, [class*='clip'], [style*='clip-path']",
    );
    for (const el of nodes) {
      if (!(el instanceof HTMLElement)) continue;
      const style = getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        continue;
      }
      // Clip-path bands intentionally truncate with ellipsis — skip those.
      if (style.clipPath && style.clipPath !== "none") {
        const text = (el.innerText || "").trim();
        if (el.scrollWidth > el.clientWidth + 2 && !style.textOverflow.includes("ellipsis") && !el.querySelector(".truncate")) {
          // Still report if the band itself overflows its parent
          const parent = el.parentElement;
          if (parent && el.getBoundingClientRect().right > parent.getBoundingClientRect().right + 2) {
            offenders.push({
              kind: "clip-band",
              text: text.slice(0, 40),
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
            });
          }
        }
        continue;
      }
      if (el.clientWidth < 8 || el.clientHeight < 8) continue;
      if (el.scrollWidth > el.clientWidth + 2) {
        const text = (el.innerText || el.getAttribute("aria-label") || "").trim();
        if (!text && el.tagName !== "INPUT") continue;
        offenders.push({
          kind: "text",
          tag: el.tagName,
          text: text.slice(0, 60),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        });
      }
    }

    // Risk nudge row: ensure single horizontal line (no wrap to two rows)
    const riskRows = [];
    document.querySelectorAll("#workshop-risk-low, #workshop-risk-mid, #workshop-risk-high").forEach((input) => {
      const row = input.closest(".flex");
      if (!row) return;
      const kids = [...row.children].filter((c) => {
        if (!(c instanceof HTMLElement)) return false;
        const style = getComputedStyle(c);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const r = c.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (kids.length < 2) return;
      const tops = kids.map((c) => Math.round(c.getBoundingClientRect().top));
      const lefts = kids.map((c) => Math.round(c.getBoundingClientRect().left));
      const wrapped = Math.max(...tops) - Math.min(...tops) > 12;
      const notLtr = lefts[0] >= lefts[lefts.length - 1];
      riskRows.push({ id: input.id, wrapped: wrapped || notLtr, tops, lefts });
    });

    // Expense / goal grids should be 1-col below ~640
    const goalGrids = [
      ...document.querySelectorAll("[data-qa='pyramid-step'] .grid"),
    ].map((g) => {
      const style = getComputedStyle(g);
      return {
        cols: style.gridTemplateColumns,
      };
    });

    return {
      pageScroll,
      viewport: window.innerWidth,
      offenders: offenders.slice(0, 15),
      riskRows,
      goalGrids,
    };
  });
}

async function checkWidth(browser, width) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    isMobile: true,
    hasTouch: true,
    locale: "zh-HK",
  });
  await setZhHant(context.pages()[0] ? context.pages()[0] : await context.newPage());
  const page = await context.newPage();
  await setZhHant(page);

  const url = `${BASE}/workshop/pyramid/touch-fixture`;
  const res = await page.goto(url, { waitUntil: "networkidle" });
  assert(res && res.ok(), `HTTP ${res?.status()} at ${width}px`);

  // Ensure zh-Hant UI (click switcher if cookie alone wasn't enough)
  const zhBtn = page.getByRole("button", { name: /繁體中文|繁/ });
  if (await zhBtn.count()) {
    await zhBtn.first().click().catch(() => {});
    await page.waitForTimeout(300);
  }

  await page.locator("[data-qa='pyramid-step']").waitFor({ state: "visible" });
  // Scroll through packed sections so layout settles
  for (const sel of [
    "[data-qa='pyramid-step']",
    "[data-qa='expenses']",
  ]) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
  }

  const report = await measureOverflow(page);
  assert(!report.pageScroll, `${width}px: page horizontal scroll detected`);
  assert(
    report.offenders.length === 0,
    `${width}px: overflow offenders: ${JSON.stringify(report.offenders, null, 2)}`,
  );
  for (const row of report.riskRows) {
    assert(!row.wrapped, `${width}px: risk row wrapped awkwardly (${row.id})`);
  }
  // Below sm (640), grids should be single column
  if (width < 640) {
    for (const g of report.goalGrids) {
      const colCount = g.cols.split(/\s+/).filter((c) => c && c !== "none").length;
      // "minmax(0, 1fr)" or single track is OK; reject 2 equal fr tracks
      if (g.cols.includes("1fr 1fr") || (colCount >= 2 && !g.cols.includes("minmax(0px, 1fr)"))) {
        // Tailwind sm:grid-cols-2 only at 640+; at mobile should be one column = one track
        assert(
          colCount <= 1 || g.cols === "none" || g.cols.startsWith("1fr") && !g.cols.includes("1fr 1fr"),
          `${width}px: unexpected multi-col grid: ${g.cols}`,
        );
      }
    }
  }

  // Pyramid band labels present in Chinese
  const body = await page.locator("body").innerText();
  assert(/保障|應急|目標|投資/.test(body), `${width}px: missing zh band labels`);

  console.log(`  OK  ${width}px zh-Hant — no page scroll, no text overflow, risk rows single-line`);
  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  console.log(`[responsive-cjk] ${BASE} widths=${WIDTHS.join(",")}`);
  for (const width of WIDTHS) {
    await checkWidth(browser, width);
  }
  console.log("[responsive-cjk] PASS");
  await browser.close();
}

main().catch((err) => {
  console.error("[responsive-cjk] FAIL", err);
  process.exit(1);
});
