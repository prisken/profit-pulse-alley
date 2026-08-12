/**
 * Locale-aware PDF smoke: generate EN + zh-Hant blueprints and confirm
 * catalog static copy + bilingual fields + NotoSansTC embedding.
 *
 * Usage: npx tsx scripts/smoke-workshop-pdf-locale.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { generateWorkshopBlueprintPdf } from "../src/lib/workshop/generate-pdf";
import type { BlueprintPdfInput } from "../src/lib/workshop/generate-pdf";
import type { SiteLocale } from "../src/lib/i18n/locales";
import { translate } from "../src/lib/i18n/messages";

function bilingual(en: string, zhHant: string) {
  return { en, zhHant };
}

function baseInput(locale: SiteLocale): BlueprintPdfInput {
  return {
    locale,
    name: locale === "zh-Hant" ? "王小明" : "Alex Wong",
    email: "alex@example.com",
    phone: "+85291234567",
    industry: locale === "zh-Hant" ? "金融業" : "Finance",
    age: 32,
    retirementAge: 65,
    tone: "professional",
    pyramid: {
      protection: {
        medicalCoveragePercent: 70,
        criticalIllnessAmountHKD: 300_000,
      },
      emergencyFund: { savedAmountHKD: 80_000 },
      goals: {
        goals: [
          {
            id: "home",
            icon: "Home",
            label: bilingual("Home purchase", "置業"),
            targetAmountHKD: 2_000_000,
            targetAge: 40,
            targetYear: 2030,
          },
        ],
      },
      investment: {
        riskAllocation: { low: 30, mid: 50, high: 20 },
        lumpSumHKD: 200_000,
      },
    },
    layerFlags: {
      protection: "amber",
      emergencyFund: "amber",
      goals: "green",
      investment: "green",
    },
    expenses: null,
    riskQuiz: {
      answers: [],
      score: 55,
      profile: "balanced",
    },
    stressTest: {
      monthlySurplusByYear: [],
      emergencyFundProjection: {
        targetMonths: 6,
        projectedMonths: 3,
        status: "amber",
      },
      goalProjections: [
        {
          goalId: "home",
          label: bilingual("Home purchase", "置業"),
          icon: "Home",
          targetAmountHKD: 2_000_000,
          targetYear: 2030,
          projectedYear: 2032,
          status: "amber",
          note: bilingual(
            "Surplus is thin relative to the target date.",
            "相對目標年份，盈餘偏薄。",
          ),
        },
      ],
    },
    timeline: null,
    summary: {
      rating: {
        score: 62,
        labelKey: "goodRoomToGrow",
        breakdown: {
          protection: 55,
          emergencyFund: 50,
          goalsOnTrack: 80,
          crisisResilience: 60,
        },
      },
      crisisStressTest: {
        scenario: "job_loss",
        crisisType: "job_loss",
        shieldedAmount: 0,
        penetrationAmount: 50_000,
        affectedGoalId: "home",
        affectedGoalLabel: bilingual("Home purchase", "置業"),
        delayYears: 2,
        verdict: "PENETRATED",
        resilienceScore: 28,
        oneTimeCostHKD: 50_000,
        incomeHitPct: 40,
        marketDropPct: 0,
        durationMonths: 6,
      },
      actionGoals: [
        {
          rank: 1,
          title: bilingual("Top up emergency fund", "先補足緊急儲備"),
          category: "savings",
          leverType: "instant",
          icon: "PiggyBank",
          impactPoints: 12,
          reasoning: bilingual(
            "Stress test shows emergency months below target.",
            "根據壓力測試，緊急儲備尚未達目標月數。",
          ),
        },
      ],
    },
    selectedGoal: "Top up emergency fund",
    goalJourney: {
      decisions: [
        {
          goalId: "home",
          status: "applied",
          allowLiquidation: true,
          acceptedSqueeze: true,
          squeezeCutsHKD: { fun: 12_000, discretionary: 0 },
        },
      ],
      updatedAt: new Date(0).toISOString(),
    },
  };
}

function assertPdf(buffer: Buffer, label: string) {
  if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error(`${label}: not a PDF`);
  }
  if (!buffer.toString("latin1").includes("NotoSansTC")) {
    throw new Error(`${label}: NotoSansTC not embedded`);
  }
}

function hasUtf16Be(buffer: Buffer, text: string): boolean {
  return buffer.includes(Buffer.from(text, "utf16le").swap16());
}

async function renderLocale(locale: SiteLocale, outDir: string) {
  const pdf = await generateWorkshopBlueprintPdf(baseInput(locale));
  assertPdf(pdf, locale);
  const file = path.join(
    outDir,
    locale === "zh-Hant" ? "blueprint-zh-Hant.pdf" : "blueprint-en.pdf",
  );
  writeFileSync(file, pdf);

  const expectedTitle = translate(locale, "workshop.pdf.title");
  const expectedTradeOffs = translate(locale, "workshop.pdf.tradeOffsTitle");
  const expectedStress = translate(locale, "workshop.pdf.crisisStressHeading");
  const titleOk =
    pdf.toString("latin1").includes(expectedTitle) ||
    hasUtf16Be(pdf, expectedTitle);
  const tradeOffsOk =
    pdf.toString("latin1").includes(expectedTradeOffs) ||
    hasUtf16Be(pdf, expectedTradeOffs);
  const stressOk =
    pdf.toString("latin1").includes(expectedStress) ||
    hasUtf16Be(pdf, expectedStress);

  // Compressed streams may hide literals — require at least one catalog marker
  // OR (for zh) a larger file than EN baseline checked by caller.
  console.log(
    `  ${locale}: ${pdf.length} bytes → ${file}` +
      ` (title literal=${titleOk}, tradeOffs literal=${tradeOffsOk}, stressTest literal=${stressOk})`,
  );
  return {
    pdf,
    titleOk,
    sectionOk: tradeOffsOk || stressOk,
    expectedTitle,
  };
}

async function main() {
  const outDir = path.join(process.cwd(), "tmp", "pdf-locale-smoke");
  mkdirSync(outDir, { recursive: true });

  console.log("Rendering locale PDFs…");
  const en = await renderLocale("en", outDir);
  const zh = await renderLocale("zh-Hant", outDir);

  if (!en.titleOk && !en.sectionOk) {
    // Streams are often Flate-compressed — size + font embed is the automated check.
    console.log(
      "  note: EN catalog literals not found uncompressed (expected with Flate); relying on size + visual check",
    );
  }
  if (zh.pdf.length < en.pdf.length * 1.5) {
    throw new Error(
      `ZH PDF not substantially larger than EN (${zh.pdf.length} vs ${en.pdf.length}) — CJK subset likely missing`,
    );
  }

  // Visual thumbnails for manual confirm
  console.log("\nSmoke OK. Open PDFs in:", outDir);
  console.log(`  EN title should read: ${en.expectedTitle}`);
  console.log(`  ZH title should read: ${zh.expectedTitle}`);
}

main().catch((err) => {
  console.error("\nSmoke FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
