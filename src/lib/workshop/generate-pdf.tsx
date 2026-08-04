import React from "react";
import path from "node:path";
import {
  Circle,
  Document,
  Font,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { pickBilingual } from "@/lib/workshop/bilingual";
import { computePassiveCoverageRatio } from "@/lib/workshop/coverage-ratio";
import type { SiteLocale } from "@/lib/i18n/locales";
import {
  translate,
  translateWith,
  type MessageKey,
} from "@/lib/i18n/messages";
import {
  deriveTradeOffDecisions,
  type TradeOffDecisionsSummary,
} from "@/lib/workshop/trade-off-decisions";
import type {
  ActionGoal,
  CrisisStressTestSummary,
  ExpensesState,
  GoalJourneyState,
  LayerFlag,
  LayerFlags,
  PyramidState,
  RiskProfile,
  RiskQuizState,
  StressTestResult,
  SummaryRatingLabelKey,
  SummaryState,
  WorkshopTone,
} from "@/lib/workshop/types";
import type { TimelineResult } from "@/lib/workshop/timeline-engine";

/** Single family covers Latin + Traditional Chinese (OFL Noto Sans TC). */
const PDF_FONT_FAMILY = "NotoSansTC";

const NOTO_SANS_TC_DIR = path.join(
  process.cwd(),
  "public",
  "fonts",
  "noto-sans-tc",
);

Font.register({
  family: PDF_FONT_FAMILY,
  fonts: [
    {
      src: path.join(NOTO_SANS_TC_DIR, "NotoSansTC-Regular.otf"),
      fontWeight: 400,
    },
    {
      src: path.join(NOTO_SANS_TC_DIR, "NotoSansTC-Bold.otf"),
      fontWeight: 700,
    },
  ],
});

// CJK words have no spaces — split so react-pdf can wrap without blank boxes / overflow.
Font.registerHyphenationCallback((word) => {
  if (/[\u3400-\u9fff\uf900-\ufaff]/.test(word)) {
    return Array.from(word);
  }
  return [word];
});

const RATING_LABEL_KEYS: Record<SummaryRatingLabelKey, MessageKey> = {
  needsAttention: "workshop.summary.ratingLabels.needsAttention",
  goodRoomToGrow: "workshop.summary.ratingLabels.goodRoomToGrow",
  strongFoundation: "workshop.summary.ratingLabels.strongFoundation",
};

const CRISIS_STRESS_SCENARIO_KEYS: Record<
  CrisisStressTestSummary["scenario"],
  MessageKey
> = {
  medical: "workshop.summary.crisisStress.scenario.medical",
  critical_illness: "workshop.summary.crisisStress.scenario.critical_illness",
  job_loss: "workshop.summary.crisisStress.scenario.job_loss",
  market_crash: "workshop.summary.crisisStress.scenario.market_crash",
  accident: "workshop.summary.crisisStress.scenario.accident",
};

const CRISIS_STRESS_VERDICT_KEYS: Record<
  CrisisStressTestSummary["verdict"],
  MessageKey
> = {
  SHIELDED: "workshop.summary.crisisStress.verdict.SHIELDED",
  PARTIAL: "workshop.summary.crisisStress.verdict.PARTIAL",
  PENETRATED: "workshop.summary.crisisStress.verdict.PENETRATED",
};

function crisisStressBody(
  stress: CrisisStressTestSummary,
  locale: SiteLocale,
  t: (key: MessageKey) => string,
): string {
  const scenario = t(CRISIS_STRESS_SCENARIO_KEYS[stress.scenario]);
  const goalName = stress.affectedGoalLabel
    ? pickBilingual(stress.affectedGoalLabel, locale)
    : "";
  const shielded = formatHkd(stress.shieldedAmount);
  const penetration = formatHkd(stress.penetrationAmount);
  const wiped = formatHkd(
    Math.max(
      stress.penetrationAmount,
      stress.oneTimeCostHKD - stress.shieldedAmount,
    ),
  );

  if (stress.verdict === "SHIELDED") {
    return goalName
      ? t("workshop.summary.crisisStress.shieldedWithGoal")
          .replace("{scenario}", scenario)
          .replace("{amount}", shielded)
          .replace("{goal}", goalName)
      : t("workshop.summary.crisisStress.shieldedNoGoal")
          .replace("{scenario}", scenario)
          .replace("{amount}", shielded);
  }
  if (stress.verdict === "PARTIAL") {
    return goalName
      ? t("workshop.summary.crisisStress.partialWithGoal")
          .replace("{scenario}", scenario)
          .replace("{shielded}", shielded)
          .replace("{penetration}", penetration)
          .replace("{goal}", goalName)
      : t("workshop.summary.crisisStress.partialNoGoal")
          .replace("{scenario}", scenario)
          .replace("{shielded}", shielded)
          .replace("{penetration}", penetration);
  }
  if (goalName && stress.delayYears != null && stress.delayYears > 0) {
    return t("workshop.summary.crisisStress.penetratedWithGoal")
      .replace("{scenario}", scenario)
      .replace("{amount}", wiped)
      .replace("{goal}", goalName)
      .replace("{years}", String(stress.delayYears));
  }
  return t("workshop.summary.crisisStress.penetratedNoGoal")
    .replace("{scenario}", scenario)
    .replace("{amount}", wiped);
}

const TONE_SUBTITLE_KEYS: Record<WorkshopTone, MessageKey> = {
  fun: "workshop.pdf.subtitleByTone.fun",
  professional: "workshop.pdf.subtitleByTone.professional",
  simple: "workshop.pdf.subtitleByTone.simple",
  direct: "workshop.pdf.subtitleByTone.direct",
  warm: "workshop.pdf.subtitleByTone.warm",
};

const LAYER_TITLE_KEYS: Record<keyof LayerFlags, MessageKey> = {
  protection: "workshop.pyramid.layers.protection.title",
  emergencyFund: "workshop.pyramid.layers.emergencyFund.title",
  goals: "workshop.pyramid.layers.goals.title",
  investment: "workshop.pyramid.layers.investment.title",
};

const BREAKDOWN_LABEL_KEYS: Array<{
  key: keyof SummaryState["rating"]["breakdown"];
  labelKey: MessageKey;
}> = [
  {
    key: "protection",
    labelKey: "workshop.summary.breakdownLabels.protection",
  },
  {
    key: "emergencyFund",
    labelKey: "workshop.summary.breakdownLabels.emergencyFund",
  },
  {
    key: "goalsOnTrack",
    labelKey: "workshop.summary.breakdownLabels.goalsOnTrack",
  },
  {
    key: "crisisResilience",
    labelKey: "workshop.summary.breakdownLabels.crisisResilience",
  },
];

const RISK_PROFILE_LABEL_KEYS: Record<RiskProfile, MessageKey> = {
  conservative: "workshop.riskProfile.labels.conservative",
  balanced: "workshop.riskProfile.labels.balanced",
  aggressive: "workshop.riskProfile.labels.aggressive",
};

const ACTION_GOAL_CATEGORY_KEYS: Record<
  ActionGoal["category"],
  MessageKey
> = {
  protection: "workshop.summary.categories.protection",
  savings: "workshop.summary.categories.savings",
  investment: "workshop.summary.categories.investment",
  goal: "workshop.summary.categories.goal",
};

export type BlueprintPdfInput = {
  locale: SiteLocale;
  name: string;
  email: string;
  phone?: string;
  industry: string;
  age: number;
  retirementAge?: number;
  tone: WorkshopTone;
  pyramid: PyramidState;
  layerFlags: LayerFlags;
  expenses: ExpensesState | null;
  riskQuiz: RiskQuizState | null;
  stressTest: StressTestResult | null;
  /** v3 life timeline when macroResultJson is versioned; null for legacy sessions. */
  timeline: TimelineResult | null;
  summary: SummaryState | null;
  selectedGoal: string | null;
  /** Goal journey decisions for "Your Trade-Off Decisions". */
  goalJourney: GoalJourneyState | null;
};

const FLAG_FILL: Record<LayerFlag, string> = {
  green: "#10b981",
  amber: "#fbbf24",
  red: "#f43f5e",
};

/** Ink on bright trapezoid fills — white on emerald/rose; dark on amber. */
const FLAG_INK: Record<LayerFlag, string> = {
  green: "#ffffff",
  amber: "#0f172a",
  red: "#ffffff",
};

const PDF_COLORS = {
  pageBg: "#ffffff",
  body: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  track: "#f1f5f9",
  emerald: "#059669",
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontSize: 9,
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 400,
    color: PDF_COLORS.body,
    backgroundColor: PDF_COLORS.pageBg,
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    color: PDF_COLORS.body,
  },
  titleDirect: {
    fontSize: 18,
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    color: PDF_COLORS.body,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 9,
    color: PDF_COLORS.muted,
    lineHeight: 1.35,
  },
  subtitleWarm: {
    marginTop: 4,
    fontSize: 9,
    color: "#9f1239",
    lineHeight: 1.35,
  },
  meta: {
    marginTop: 4,
    fontSize: 8,
    color: PDF_COLORS.muted,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    marginBottom: 6,
    color: PDF_COLORS.body,
  },
  sectionTitleDirect: {
    fontSize: 11,
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    marginBottom: 6,
    color: PDF_COLORS.body,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  twoCol: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
    marginRight: 6,
  },
  colLast: {
    flex: 1,
    marginLeft: 6,
  },
  card: {
    padding: 8,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    backgroundColor: PDF_COLORS.pageBg,
  },
  label: {
    color: PDF_COLORS.muted,
    fontSize: 8,
  },
  value: {
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    fontSize: 9,
    color: PDF_COLORS.body,
  },
  small: {
    fontSize: 8,
    color: PDF_COLORS.muted,
    lineHeight: 1.35,
  },
  goalBlock: {
    marginBottom: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    backgroundColor: PDF_COLORS.pageBg,
  },
  goalTitle: {
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    fontSize: 9,
    marginBottom: 2,
    color: PDF_COLORS.body,
  },
  goalTitleSelected: {
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    fontSize: 9,
    marginBottom: 2,
    color: PDF_COLORS.emerald,
  },
  impact: {
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    fontSize: 9,
    color: PDF_COLORS.emerald,
    marginBottom: 2,
  },
  barTrack: {
    height: 10,
    borderRadius: 4,
    backgroundColor: PDF_COLORS.track,
    overflow: "hidden",
    flexDirection: "row",
  },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  impactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  swatch: {
    width: 8,
    height: 8,
    marginTop: 2,
    marginRight: 6,
    borderRadius: 1,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 7,
    color: PDF_COLORS.muted,
    textAlign: "center",
    lineHeight: 1.3,
  },
  gaugeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeScore: {
    position: "absolute",
    top: 38,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: 700,
    color: PDF_COLORS.body,
  },
  gaugeLabel: {
    marginTop: 4,
    fontSize: 8,
    textAlign: "center",
    color: PDF_COLORS.muted,
  },
  pyramidWrap: {
    alignItems: "center",
    marginTop: 4,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});

function sectionTitleStyle(tone: WorkshopTone) {
  return tone === "direct" ? styles.sectionTitleDirect : styles.sectionTitle;
}

function documentTitleStyle(tone: WorkshopTone) {
  return tone === "direct" ? styles.titleDirect : styles.title;
}

function documentSubtitleStyle(tone: WorkshopTone) {
  return tone === "warm" ? styles.subtitleWarm : styles.subtitle;
}

function formatHkd(value: number): string {
  return `HK$${Math.round(value).toLocaleString("en-HK")}`;
}

function scoreBand(score: number): LayerFlag {
  if (score <= 40) {
    return "red";
  }
  if (score <= 70) {
    return "amber";
  }
  return "green";
}

function trapezoidPath(
  topLeft: number,
  topRight: number,
  bottomLeft: number,
  bottomRight: number,
  y: number,
  height: number,
): string {
  return [
    `M ${topLeft} ${y}`,
    `L ${topRight} ${y}`,
    `L ${bottomRight} ${y + height}`,
    `L ${bottomLeft} ${y + height}`,
    "Z",
  ].join(" ");
}

function PyramidGraphic({
  flags,
  pyramid,
  locale,
}: {
  flags: LayerFlags;
  pyramid: PyramidState;
  locale: SiteLocale;
}) {
  const width = 260;
  const bandH = 28;
  const gap = 2;
  const center = width / 2;
  const goalCount = pyramid.goals.goals.length;

  const bands: Array<{
    key: keyof LayerFlags;
    label: string;
    topW: number;
    bottomW: number;
    detail: string;
  }> = [
    {
      key: "investment",
      label: translate(locale, LAYER_TITLE_KEYS.investment),
      topW: 70,
      bottomW: 110,
      detail: translateWith(locale, "workshop.pdf.investPerMonth", {
        amount: formatHkd(
          pyramid.investment.lumpSumHKD ??
            pyramid.investment.monthlyInvestmentHKD ??
            0,
        ),
      }),
    },
    {
      key: "goals",
      label: translate(locale, LAYER_TITLE_KEYS.goals),
      topW: 110,
      bottomW: 150,
      detail: translateWith(
        locale,
        goalCount === 1
          ? "workshop.pyramid.goals.countOne"
          : "workshop.pyramid.goals.countPlural",
        { count: goalCount },
      ),
    },
    {
      key: "emergencyFund",
      label: translate(locale, LAYER_TITLE_KEYS.emergencyFund),
      topW: 150,
      bottomW: 190,
      detail: formatHkd(pyramid.emergencyFund.savedAmountHKD),
    },
    {
      key: "protection",
      label: translate(locale, LAYER_TITLE_KEYS.protection),
      topW: 190,
      bottomW: 240,
      detail: translateWith(locale, "workshop.pdf.protectionDetail", {
        percent: Math.round(pyramid.protection.medicalCoveragePercent),
        amount: formatHkd(pyramid.protection.criticalIllnessAmountHKD),
      }),
    },
  ];

  const totalH = bands.length * bandH + (bands.length - 1) * gap;

  return (
    <View style={styles.pyramidWrap}>
      <Svg width={width} height={totalH} viewBox={`0 0 ${width} ${totalH}`}>
        {bands.map((band, index) => {
          const y = index * (bandH + gap);
          const topHalf = band.topW / 2;
          const bottomHalf = band.bottomW / 2;
          const fill = FLAG_FILL[flags[band.key]];
          const ink = FLAG_INK[flags[band.key]];
          return (
            <React.Fragment key={band.key}>
              <Path
                d={trapezoidPath(
                  center - topHalf,
                  center + topHalf,
                  center - bottomHalf,
                  center + bottomHalf,
                  y,
                  bandH,
                )}
                fill={fill}
              />
              <Text
                x={center}
                y={y + bandH / 2 + 3}
                style={{
                  fontSize: 7,
                  fontFamily: PDF_FONT_FAMILY,
                  fontWeight: 700,
                  fill: ink,
                  textAnchor: "middle",
                }}
              >
                {band.label}
              </Text>
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ marginTop: 6, width: "100%" }}>
        {bands.map((band) => (
          <View key={band.key} style={styles.row}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: FLAG_FILL[flags[band.key]] },
                ]}
              />
              <Text style={styles.value}>{band.label}</Text>
            </View>
            <Text style={styles.small}>{band.detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RatingGauge({ score, label }: { score: number; label: string }) {
  const band = scoreBand(score);
  const r = 42;
  const c = 2 * Math.PI * r;
  const capped = Math.min(100, Math.max(0, score));
  const dash = (capped / 100) * c;

  return (
    <View style={styles.gaugeWrap}>
      <View style={{ width: 110, height: 110, position: "relative" }}>
        <Svg width={110} height={110} viewBox="0 0 110 110">
          <Circle
            cx={55}
            cy={55}
            r={r}
            stroke="#e2e8f0"
            strokeWidth={9}
            fill="none"
          />
          <Circle
            cx={55}
            cy={55}
            r={r}
            stroke={FLAG_FILL[band]}
            strokeWidth={9}
            fill="none"
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
          />
        </Svg>
        <Text style={styles.gaugeScore}>
          {Math.round(score)}
        </Text>
      </View>
      <Text style={styles.gaugeLabel}>{label}</Text>
    </View>
  );
}

function ProgressBar({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
  const width = Math.min(100, Math.max(0, percent));
  return (
    <View style={styles.barTrack}>
      <View
        style={{
          width: `${width}%`,
          height: 10,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function goalProgressPercent(
  targetYear: number,
  projectedYear: number | null,
  status: LayerFlag,
): number {
  if (status === "green") {
    return 100;
  }
  if (projectedYear == null) {
    return 12;
  }
  const now = new Date().getFullYear();
  const idealSpan = Math.max(1, targetYear - now);
  const actualSpan = Math.max(1, projectedYear - now);
  // On/early: high; delayed: shrink by overrun ratio.
  return Math.min(100, Math.round((idealSpan / actualSpan) * 100));
}

function RiskAllocationBar({
  low,
  mid,
  high,
  locale,
}: {
  low: number;
  mid: number;
  high: number;
  locale: SiteLocale;
}) {
  return (
    <View>
      <View style={styles.barTrack}>
        <View
          style={{
            width: `${low}%`,
            height: 10,
            backgroundColor: "#38bdf8",
          }}
        />
        <View
          style={{
            width: `${mid}%`,
            height: 10,
            backgroundColor: "#fbbf24",
          }}
        />
        <View
          style={{
            width: `${high}%`,
            height: 10,
            backgroundColor: "#34d399",
          }}
        />
      </View>
      <View style={[styles.row, { marginTop: 4 }]}>
        <Text style={styles.small}>
          {translateWith(locale, "workshop.pdf.lowMidHigh", { low })}
        </Text>
        <Text style={styles.small}>
          {translateWith(locale, "workshop.pdf.midPct", { mid })}
        </Text>
        <Text style={styles.small}>
          {translateWith(locale, "workshop.pdf.highPct", { high })}
        </Text>
      </View>
    </View>
  );
}

function BlueprintDocument({ data }: { data: BlueprintPdfInput }) {
  const { locale } = data;
  const rating = data.summary?.rating ?? null;
  const actionGoals = data.summary?.actionGoals ?? [];
  const crisisStressTest = data.summary?.crisisStressTest ?? null;
  const risk = data.pyramid.investment.riskAllocation;
  const timeline = data.timeline;
  const goalProjections = data.stressTest?.goalProjections ?? [];
  const t = (key: MessageKey) => translate(locale, key);
  const tWith = (key: MessageKey, vars: Record<string, string | number>) =>
    translateWith(locale, key, vars);

  const profileLabel = (profile: RiskProfile) =>
    t(RISK_PROFILE_LABEL_KEYS[profile]);

  const metaParts = [
    data.name,
    data.email,
    ...(data.phone ? [data.phone] : []),
    tWith("workshop.pdf.ageIndustry", {
      age: data.age,
      industry: data.industry,
    }),
  ];
  if (data.riskQuiz) {
    metaParts.push(
      tWith("workshop.pdf.riskProfileMeta", {
        profile: profileLabel(data.riskQuiz.profile),
        score: data.riskQuiz.score,
      }),
    );
  }

  const retirementAge =
    timeline?.retirement.retirementAge ?? data.retirementAge ?? null;
  const efOversaved = timeline?.emergencyFund.status === "oversaved";

  const tradeOffs: TradeOffDecisionsSummary | null = deriveTradeOffDecisions({
    pyramid: data.pyramid,
    journey: data.goalJourney,
  });
  const showTradeOffs =
    tradeOffs != null &&
    (tradeOffs.secured.length > 0 ||
      tradeOffs.deprioritized.length > 0 ||
      tradeOffs.squeezesAccepted.length > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={documentTitleStyle(data.tone)}>
            {t("workshop.pdf.title")}
          </Text>
          <Text style={documentSubtitleStyle(data.tone)}>
            {t(TONE_SUBTITLE_KEYS[data.tone] ?? TONE_SUBTITLE_KEYS.professional)}
          </Text>
          <Text style={styles.meta}>{metaParts.join(" · ")}</Text>
        </View>

        <View style={styles.twoCol}>
          <View style={[styles.col, styles.card]}>
            <Text style={sectionTitleStyle(data.tone)}>
              {t("workshop.pdf.pyramidSectionTitle")}
            </Text>
            <PyramidGraphic
              flags={data.layerFlags}
              pyramid={data.pyramid}
              locale={locale}
            />
          </View>
          <View style={[styles.colLast, styles.card, { alignItems: "center" }]}>
            <Text style={sectionTitleStyle(data.tone)}>
              {t("workshop.pdf.ratingSectionTitle")}
            </Text>
            {rating ? (
              <>
                <RatingGauge
                  score={rating.score}
                  label={t(RATING_LABEL_KEYS[rating.labelKey])}
                />
                <View style={{ width: "100%", marginTop: 8 }}>
                  {BREAKDOWN_LABEL_KEYS.map(({ key, labelKey }) => {
                    const value = rating.breakdown[key];
                    return (
                      <View key={key} style={{ marginBottom: 4 }}>
                        <View style={styles.barLabelRow}>
                          <Text style={styles.label}>{t(labelKey)}</Text>
                          <Text style={styles.small}>{value}%</Text>
                        </View>
                        <ProgressBar
                          percent={value}
                          color={FLAG_FILL[scoreBand(value)]}
                        />
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <Text style={styles.small}>
                {t("workshop.pdf.ratingUnavailable")}
              </Text>
            )}
          </View>
        </View>

        {timeline || retirementAge != null ? (
          <View style={[styles.section, styles.card]} wrap={false}>
            <Text style={sectionTitleStyle(data.tone)}>
              {t("workshop.pdf.retirementSectionTitle")}
            </Text>
            <Text style={[styles.small, { marginBottom: 4 }]}>
              {t("workshop.pdf.realTermsCaption")}
            </Text>
            <Text style={styles.small}>
              {tWith("workshop.pdf.retirementAgeLine", {
                age: retirementAge ?? "—",
              })}
            </Text>
            {timeline ? (
              <>
                <Text style={[styles.small, { marginTop: 2 }]}>
                  {tWith("workshop.pdf.retirementPassiveLine", {
                    amount: formatHkd(
                      timeline.retirement.passiveIncomeAtRetirement,
                    ),
                  })}
                </Text>
                <Text style={[styles.small, { marginTop: 2 }]}>
                  {tWith("workshop.pdf.retirementAssetsLine", {
                    amount: formatHkd(timeline.retirement.assetsAtRetirement),
                  })}
                </Text>
                {(() => {
                  const retRow = timeline.rows.find(
                    (r) => r.age === timeline.retirement.retirementAge,
                  );
                  if (!retRow || retRow.expenses <= 0) {
                    return null;
                  }
                  const coverage = computePassiveCoverageRatio(
                    timeline.retirement.passiveIncomeAtRetirement,
                    retRow.expenses,
                  );
                  if (coverage.percent == null) {
                    return null;
                  }
                  return (
                    <Text style={[styles.small, { marginTop: 2 }]}>
                      {tWith("workshop.pdf.retirementCoverageLine", {
                        percent: Math.round(coverage.percent),
                      })}
                    </Text>
                  );
                })()}
                {(timeline.retirementTargets ?? []).map((rt) => (
                  <Text
                    key={rt.goalId}
                    style={[styles.small, { marginTop: 2 }]}
                  >
                    {rt.met
                      ? tWith("workshop.pdf.retirementNestEggMet", {
                          target: formatHkd(rt.targetHKD),
                          projected: formatHkd(rt.projectedAssetsHKD),
                        })
                      : tWith("workshop.pdf.retirementNestEggGap", {
                          target: formatHkd(rt.targetHKD),
                          projected: formatHkd(rt.projectedAssetsHKD),
                          gap: formatHkd(rt.gapHKD),
                        })}
                  </Text>
                ))}
                <Text style={[styles.small, { marginTop: 2 }]}>
                  {timeline.retirement.assetsDepletedAtAge != null
                    ? tWith("workshop.pdf.retirementDepletedLine", {
                        age: timeline.retirement.assetsDepletedAtAge,
                      })
                    : t("workshop.pdf.retirementSustainedLine")}
                </Text>
              </>
            ) : null}
          </View>
        ) : null}

        {showTradeOffs && tradeOffs ? (
          <View style={[styles.section, styles.card]} wrap={false}>
            <Text style={sectionTitleStyle(data.tone)}>
              {t("workshop.pdf.tradeOffsTitle")}
            </Text>
            {tradeOffs.secured.length > 0 ? (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.label}>
                  {t("workshop.pdf.tradeOffsSecuredHeading")}
                </Text>
                {tradeOffs.secured.map((row) => (
                  <Text
                    key={row.goalId}
                    style={[styles.small, { marginBottom: 2 }]}
                  >
                    {row.usedLiquidation
                      ? tWith("workshop.pdf.tradeOffsSecuredWithLiquidation", {
                          goal: pickBilingual(row.label, locale),
                          age: row.targetAge,
                        })
                      : tWith("workshop.pdf.tradeOffsSecuredNoLiquidation", {
                          goal: pickBilingual(row.label, locale),
                          age: row.targetAge,
                        })}
                  </Text>
                ))}
              </View>
            ) : null}
            {tradeOffs.deprioritized.length > 0 ? (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.label}>
                  {t("workshop.pdf.tradeOffsDeprioritizedHeading")}
                </Text>
                {tradeOffs.deprioritized.map((row) => (
                  <Text
                    key={row.goalId}
                    style={[styles.small, { marginBottom: 2 }]}
                  >
                    {tWith("workshop.pdf.tradeOffsDeprioritizedLine", {
                      goal: pickBilingual(row.label, locale),
                      age: row.targetAge,
                    })}
                  </Text>
                ))}
              </View>
            ) : null}
            {tradeOffs.squeezesAccepted.length > 0 ? (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.label}>
                  {t("workshop.pdf.tradeOffsSqueezesHeading")}
                </Text>
                {tradeOffs.squeezesAccepted.map((row) => (
                  <Text
                    key={row.category}
                    style={[styles.small, { marginBottom: 2 }]}
                  >
                    {tWith("workshop.pdf.tradeOffsSqueezeLine", {
                      category: t(
                        row.category === "fun"
                          ? "workshop.pdf.tradeOffsCategoryFun"
                          : "workshop.pdf.tradeOffsCategoryDiscretionary",
                      ),
                      amount: formatHkd(row.monthlyAmount),
                    })}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {crisisStressTest ? (
          <View style={[styles.section, styles.card]} wrap={false}>
            <Text style={sectionTitleStyle(data.tone)}>
              {t("workshop.pdf.crisisStressHeading")}
            </Text>
            <Text style={[styles.value, { marginTop: 2 }]}>
              {t(CRISIS_STRESS_SCENARIO_KEYS[crisisStressTest.scenario])} ·{" "}
              {t(CRISIS_STRESS_VERDICT_KEYS[crisisStressTest.verdict])}
            </Text>
            <Text style={[styles.small, { marginTop: 4 }]}>
              {tWith("workshop.pdf.crisisStressAmounts", {
                shielded: formatHkd(crisisStressTest.shieldedAmount),
                penetrated: formatHkd(crisisStressTest.penetrationAmount),
              })}
            </Text>
            {crisisStressTest.affectedGoalLabel ? (
              <Text style={[styles.small, { marginTop: 2 }]}>
                {tWith("workshop.pdf.crisisStressAffectedGoal", {
                  goal: pickBilingual(
                    crisisStressTest.affectedGoalLabel,
                    locale,
                  ),
                  years:
                    crisisStressTest.delayYears != null
                      ? String(crisisStressTest.delayYears)
                      : "—",
                })}
              </Text>
            ) : null}
            <Text style={[styles.small, { marginTop: 4 }]}>
              {crisisStressBody(crisisStressTest, locale, t)}
            </Text>
          </View>
        ) : null}

        <View style={[styles.section, styles.card]}>
          <Text style={sectionTitleStyle(data.tone)}>
            {t("workshop.pdf.riskAllocationTitle")}
          </Text>
          <Text style={[styles.small, { marginBottom: 4 }]}>
            {tWith("workshop.pdf.lumpSumLine", {
              amount: formatHkd(data.pyramid.investment.lumpSumHKD),
            })}
          </Text>
          <RiskAllocationBar
            low={risk.low}
            mid={risk.mid}
            high={risk.high}
            locale={locale}
          />
          <Text style={[styles.small, { marginTop: 4 }]}>
            {t("workshop.pdf.returnBandsDisplay")}
          </Text>
          <Text style={[styles.small, { marginTop: 2 }]}>
            {t("workshop.pdf.returnAssumptionsDisclaimer")}
          </Text>
          {data.expenses ? (
            <Text style={[styles.small, { marginTop: 6 }]}>
              {tWith("workshop.pdf.expensesTotal", {
                amount: formatHkd(data.expenses.totalHKD),
                count: data.expenses.categories.length,
              })}
            </Text>
          ) : null}
          {efOversaved && timeline ? (
            <Text style={[styles.small, { marginTop: 6 }]}>
              {tWith("workshop.pdf.efOversavedNote", {
                excess: formatHkd(timeline.emergencyFund.excessHKD ?? 0),
                opportunity: formatHkd(
                  timeline.emergencyFund.opportunityCostHKD ?? 0,
                ),
              })}
            </Text>
          ) : null}
        </View>

        {timeline && timeline.goals.length > 0 ? (
          <View style={[styles.section, styles.card]} wrap={false}>
            <Text style={sectionTitleStyle(data.tone)}>
              {t("workshop.pdf.goalsSectionTitle")}
            </Text>
            {timeline.goals.map((goal) => {
              const fromPyramid = data.pyramid.goals.goals.find(
                (g) => g.id === goal.goalId,
              );
              const label = fromPyramid
                ? pickBilingual(fromPyramid.label, locale)
                : goal.goalId;
              const isRetirementTarget =
                goal.goalType === "retirementTarget" ||
                fromPyramid?.goalType === "retirementTarget";
              if (isRetirementTarget) {
                const rt = (timeline.retirementTargets ?? []).find(
                  (r) => r.goalId === goal.goalId,
                );
                const targetAmt = formatHkd(
                  rt?.targetHKD ?? goal.inflatedTargetHKD,
                );
                const projectedAmt = formatHkd(
                  rt?.projectedAssetsHKD ??
                    timeline.retirement.assetsAtRetirement,
                );
                return (
                  <View key={goal.goalId} style={{ marginBottom: 6 }}>
                    <View style={styles.barLabelRow}>
                      <Text style={styles.value}>{label}</Text>
                      <Text style={styles.small}>
                        {tWith("workshop.pdf.retirementTargetLine", {
                          target: targetAmt,
                          projected: projectedAmt,
                        })}
                      </Text>
                    </View>
                  </View>
                );
              }
              const attained =
                goal.attainedAtAge != null
                  ? tWith("workshop.pdf.goalAttainedAge", {
                      age: goal.attainedAtAge,
                    })
                  : t("workshop.pdf.notReached");
              const pct =
                goal.status === "green"
                  ? 100
                  : goal.status === "amber"
                    ? 65
                    : goal.attainedAtAge != null
                      ? 40
                      : 15;
              return (
                <View key={goal.goalId} style={{ marginBottom: 6 }}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.value}>{label}</Text>
                    <Text style={styles.small}>
                      {tWith("workshop.pdf.goalInflatedAttained", {
                        amount: formatHkd(goal.inflatedTargetHKD),
                        attained,
                      })}
                    </Text>
                  </View>
                  <ProgressBar percent={pct} color={FLAG_FILL[goal.status]} />
                </View>
              );
            })}
          </View>
        ) : goalProjections.length > 0 ? (
          <View style={[styles.section, styles.card]} wrap={false}>
            <Text style={sectionTitleStyle(data.tone)}>
              {t("workshop.pdf.goalsSectionTitle")}
            </Text>
            {goalProjections.map((goal) => {
              const pct = goalProgressPercent(
                goal.targetYear,
                goal.projectedYear,
                goal.status,
              );
              const projectedLabel =
                goal.projectedYear != null
                  ? String(goal.projectedYear)
                  : t("workshop.pdf.notReached");
              return (
                <View key={goal.goalId} style={{ marginBottom: 6 }}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.value}>
                      {pickBilingual(goal.label, locale)}
                    </Text>
                    <Text style={styles.small}>
                      {tWith("workshop.pdf.targetProjected", {
                        target: goal.targetYear,
                        projected: projectedLabel,
                      })}
                    </Text>
                  </View>
                  <ProgressBar percent={pct} color={FLAG_FILL[goal.status]} />
                </View>
              );
            })}
          </View>
        ) : null}

        {actionGoals.length > 0 ? (
          <View style={styles.section}>
            <Text style={sectionTitleStyle(data.tone)}>
              {t("workshop.pdf.actionGoalsTitle")}
            </Text>
            {actionGoals.map((goal: ActionGoal) => {
              const title = pickBilingual(goal.title, locale);
              const reasoning = pickBilingual(goal.reasoning, locale);
              const isSelected =
                data.selectedGoal != null &&
                (data.selectedGoal === title ||
                  data.selectedGoal === goal.title.en ||
                  data.selectedGoal === goal.title.zhHant);
              const excerpt =
                reasoning.length > 180
                  ? `${reasoning.slice(0, 177)}…`
                  : reasoning;
              return (
                <View key={goal.rank} style={styles.goalBlock} wrap={false}>
                  <Text
                    style={
                      isSelected ? styles.goalTitleSelected : styles.goalTitle
                    }
                  >
                    #{goal.rank} · {title}
                    {isSelected ? `  ${t("workshop.pdf.myFocus")}` : ""}
                  </Text>
                  <Text style={styles.impact}>
                    {tWith("workshop.pdf.impactLine", {
                      n: goal.impactPoints,
                      category: t(ACTION_GOAL_CATEGORY_KEYS[goal.category]),
                    })}
                  </Text>
                  <Text style={styles.small}>{excerpt}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.footer}>{t("workshop.pdf.disclaimer")}</Text>
      </Page>
    </Document>
  );
}

/**
 * Renders the workshop blueprint as a PDF Buffer.
 * Uses `locale` for static catalog copy and Bilingual field picking.
 * Relies on standalone `translate` / `translateWith` (safe in Node API routes).
 */
export async function generateWorkshopBlueprintPdf(
  data: BlueprintPdfInput,
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pdf Document root typing
    (<BlueprintDocument data={data} />) as any,
  );
  return Buffer.from(buffer);
}
