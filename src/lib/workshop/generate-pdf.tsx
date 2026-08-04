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
import type { SiteLocale } from "@/lib/i18n/locales";
import {
  translate,
  translateWith,
  type MessageKey,
} from "@/lib/i18n/messages";
import type {
  ActionGoal,
  CrisisState,
  ExpensesState,
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
  tone: WorkshopTone;
  pyramid: PyramidState;
  layerFlags: LayerFlags;
  expenses: ExpensesState | null;
  riskQuiz: RiskQuizState | null;
  stressTest: StressTestResult | null;
  crisis: CrisisState | null;
  summary: SummaryState | null;
  selectedGoal: string | null;
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
        amount: formatHkd(pyramid.investment.monthlyInvestmentHKD),
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
  const risk = data.pyramid.investment.riskAllocation;
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

        <View style={[styles.section, styles.card]}>
          <Text style={sectionTitleStyle(data.tone)}>
              {t("workshop.pdf.riskAllocationTitle")}
            </Text>
          <RiskAllocationBar
            low={risk.low}
            mid={risk.mid}
            high={risk.high}
            locale={locale}
          />
          {data.expenses ? (
            <Text style={[styles.small, { marginTop: 6 }]}>
              {tWith("workshop.pdf.expensesTotal", {
                amount: formatHkd(data.expenses.totalHKD),
                count: data.expenses.categories.length,
              })}
            </Text>
          ) : null}
        </View>

        {goalProjections.length > 0 ? (
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

        {data.crisis ? (
          <View style={[styles.section, styles.card]} wrap={false}>
            <Text style={sectionTitleStyle(data.tone)}>
              {t("workshop.pdf.crisisSectionTitle")}
            </Text>
            <Text style={styles.value}>
              {pickBilingual(data.crisis.title, locale)}
            </Text>
            <Text style={[styles.small, { marginTop: 2 }]}>
              {pickBilingual(data.crisis.description, locale)}
            </Text>
            <Text style={[styles.small, { marginTop: 4 }]}>
              {tWith("workshop.pdf.crisisStats", {
                percent: data.crisis.monthlyIncomeImpactPercent,
                amount: formatHkd(data.crisis.oneTimeCostHKD),
                months: data.crisis.durationMonths,
                profile: profileLabel(data.crisis.riskProfile),
              })}
            </Text>
            <View style={{ marginTop: 6 }}>
              {data.crisis.impacts.map((impact, index) => (
                <View
                  key={`${impact.layer}-${index}`}
                  style={styles.impactRow}
                >
                  <View
                    style={[styles.swatch, { backgroundColor: FLAG_FILL.red }]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.value}>
                      {pickBilingual(impact.headline, locale)}
                    </Text>
                    <Text style={styles.small}>
                      {impact.layer}
                      {impact.detailHKD != null
                        ? ` · ${formatHkd(impact.detailHKD)}`
                        : ""}
                      {impact.detailMonths != null
                        ? ` · ${tWith("workshop.pdf.impactMonths", {
                            n: impact.detailMonths,
                          })}`
                        : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
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
