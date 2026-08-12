"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Loader,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  predictPitchReaction,
  savePitchLead,
  type JourneySnapshot,
} from "@/lib/pitch-game/actions";
import {
  ARCHETYPES,
  BAND_META,
  GAME_UI,
  HANDOFF_COPY,
  INVESTOR,
  METRICS,
  POSTURES,
  ROUNDS,
  SETUP_COPY,
  SPECIALIST,
  TERM_SHEET_COPY,
  moduleFor,
  type ArchetypeKey,
  type BandKey,
  type Bi,
  type MetricKey,
  type PitchModule,
  type PostureKey,
  type RoundKey,
} from "@/lib/pitch-game/content";
import {
  buildFallbackReaction,
  computeBand,
  formatTimer,
  parseNumericInput,
  pick,
  resolveCondition,
  type GameLocale,
} from "@/lib/pitch-game/logic";

type Phase =
  | "setup"
  | "archetype"
  | "metric"
  | "round"
  | "question"
  | "data"
  | "reaction"
  | "posture"
  | "termsheet"
  | "handoff"
  | "done";

const MEETING_SECONDS = 20 * 60;
const MIN_REACTION_MS = 900;

function beatIndex(phase: Phase): number {
  switch (phase) {
    case "archetype":
    case "metric":
      return 0;
    case "round":
      return 1;
    case "question":
      return 2;
    case "data":
      return 3;
    case "reaction":
      return 4;
    case "posture":
      return 5;
    case "termsheet":
      return 6;
    default:
      return -1;
  }
}

const BEATS: Bi[] = [
  GAME_UI.stepStory,
  GAME_UI.stepRound,
  GAME_UI.stepQuestion,
  GAME_UI.stepNumbers,
  GAME_UI.stepReaction,
  GAME_UI.stepDefense,
  GAME_UI.stepTermSheet,
];

/* Archetype accent system — literal classes so Tailwind v4 picks them up. */
const ACCENTS: Record<
  ArchetypeKey,
  {
    chip: string;
    cardBorder: string;
    cardHover: string;
    dot: string;
    text: string;
    softBg: string;
  }
> = {
  "growth-engine": {
    chip: "bg-emerald-400/15 border-emerald-400/30",
    cardBorder: "hover:border-emerald-400/50",
    cardHover: "hover:bg-emerald-400/[0.04]",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    softBg: "bg-emerald-400/10",
  },
  "strained-ops": {
    chip: "bg-amber-400/15 border-amber-400/30",
    cardBorder: "hover:border-amber-400/50",
    cardHover: "hover:bg-amber-400/[0.04]",
    dot: "bg-amber-400",
    text: "text-amber-300",
    softBg: "bg-amber-400/10",
  },
  "margin-play": {
    chip: "bg-yellow-400/15 border-yellow-400/30",
    cardBorder: "hover:border-yellow-400/50",
    cardHover: "hover:bg-yellow-400/[0.04]",
    dot: "bg-yellow-400",
    text: "text-yellow-300",
    softBg: "bg-yellow-400/10",
  },
  "team-ceiling": {
    chip: "bg-violet-400/15 border-violet-400/30",
    cardBorder: "hover:border-violet-400/50",
    cardHover: "hover:bg-violet-400/[0.04]",
    dot: "bg-violet-400",
    text: "text-violet-300",
    softBg: "bg-violet-400/10",
  },
  "market-timing": {
    chip: "bg-cyan-400/15 border-cyan-400/30",
    cardBorder: "hover:border-cyan-400/50",
    cardHover: "hover:bg-cyan-400/[0.04]",
    dot: "bg-cyan-400",
    text: "text-cyan-300",
    softBg: "bg-cyan-400/10",
  },
};

const cardClass =
  "rounded-2xl border border-white/10 bg-[#111318] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]";

const primaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-mp-pulse px-5 py-3 text-sm font-semibold text-mp-pulse-foreground transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 mp-focus-pulse";

const ghostBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-foreground/80 transition hover:border-white/20 hover:bg-white/5 active:scale-[0.98] mp-focus-pulse";

const bandChipClass: Record<BandKey, string> = {
  green: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  amber: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  red: "border-red-400/40 bg-red-400/10 text-red-300",
};

const bandDotClass: Record<BandKey, string> = {
  green: "bg-emerald-400",
  amber: "bg-amber-400",
  red: "bg-red-400",
};

const NUMBER_RE = /(\$?\d[\d,]*(?:\.\d+)?%?|\d+(?:\.\d+)?:\d+)/g;
const NUMBER_EXACT_RE = /^\$?\d[\d,]*(?:\.\d+)?%?$|^\d+(?:\.\d+)?:\d+$/;

function highlightNumbers(text: string, cls: string): ReactNode[] {
  return text.split(NUMBER_RE).map((seg, i) =>
    NUMBER_EXACT_RE.test(seg) ? (
      <span key={i} className={cls}>
        {seg}
      </span>
    ) : (
      <span key={i}>{seg}</span>
    ),
  );
}

/**
 * Renders `**bold**` emphasis and auto-highlights every number
 * (the player's own data pops in the accent color).
 */
function Rich({
  text,
  className = "",
  highlightClass = "font-semibold text-mp-pulse",
  boldClass = "font-semibold text-foreground",
}: {
  text: string;
  className?: string;
  highlightClass?: string;
  boldClass?: string;
}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className={boldClass}>
            {highlightNumbers(part.slice(2, -2), highlightClass)}
          </strong>
        ) : (
          <span key={i}>{highlightNumbers(part, highlightClass)}</span>
        ),
      )}
    </span>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type LeadForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  concern: string;
};

const EMPTY_LEAD: LeadForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  concern: "",
};

const inputClass =
  "w-full min-h-11 rounded-xl border border-white/10 bg-[#0d0f12] px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-foreground/30 focus:border-mp-pulse/50 focus:ring-2 focus:ring-mp-pulse/25";

const CONFETTI_COLORS = [
  "#00e676",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
  "#22d3ee",
  "#f87171",
];

export default function PitchGame() {
  const { locale: siteLocale } = useLocale();
  const locale: GameLocale = siteLocale === "zh-Hant" ? "zhHant" : "en";

  const [phase, setPhase] = useState<Phase>("setup");
  const [archetype, setArchetype] = useState<ArchetypeKey | null>(null);
  const [metric, setMetric] = useState<MetricKey | null>(null);
  const [roundKey, setRoundKey] = useState<RoundKey | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [numericInputs, setNumericInputs] = useState<Record<string, number>>({});
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
  const [band, setBand] = useState<BandKey | null>(null);
  const [reactionState, setReactionState] = useState<"idle" | "loading" | "done">("idle");
  const [reaction, setReaction] = useState<string | null>(null);
  const [fromAi, setFromAi] = useState(false);
  const [posture, setPosture] = useState<PostureKey | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(MEETING_SECONDS);
  const [lead, setLead] = useState<LeadForm>(EMPTY_LEAD);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mod: PitchModule | null = useMemo(
    () => (archetype && metric ? moduleFor(archetype, metric) : null),
    [archetype, metric],
  );

  useEffect(() => {
    if (phase === "setup" || phase === "done") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  const startGame = useCallback(() => {
    setSecondsLeft(MEETING_SECONDS);
    setPhase("archetype");
  }, []);

  const restart = useCallback(() => {
    setArchetype(null);
    setMetric(null);
    setRoundKey(null);
    setInputs({});
    setNumericInputs({});
    setInputErrors({});
    setBand(null);
    setReactionState("idle");
    setReaction(null);
    setPosture(null);
    setCondition(null);
    setLead(EMPTY_LEAD);
    setLeadError(null);
    setSavedId(null);
    setSecondsLeft(MEETING_SECONDS);
    setPhase("setup");
  }, []);

  const selectArchetype = useCallback((key: ArchetypeKey) => {
    setArchetype(key);
    setPhase("metric");
  }, []);

  const selectMetric = useCallback((key: MetricKey) => {
    setMetric(key);
    setPhase("round");
  }, []);

  const selectRound = useCallback((key: RoundKey) => {
    setRoundKey(key);
    setPhase("question");
  }, []);

  const submitData = useCallback(async () => {
    if (!mod) return;
    const parsed: Record<string, number> = {};
    const errors: Record<string, string> = {};
    for (const field of mod.fields) {
      const value = parseNumericInput(inputs[field.key] ?? "");
      if (value === null || value < 0) {
        errors[field.key] = pick(GAME_UI.enterNumber, locale);
      } else {
        parsed[field.key] = value;
      }
    }
    setInputErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const computedBand = computeBand(mod, parsed);
    setNumericInputs(parsed);
    setBand(computedBand);
    setReactionState("loading");
    setPhase("reaction");
    setReaction(null);

    const started = Date.now();
    let text = buildFallbackReaction(mod, computedBand, parsed, locale);
    let ai = false;
    try {
      const result = await predictPitchReaction({
        moduleId: mod.id,
        inputs: parsed,
        roundKey: roundKey ?? "curious",
        locale,
      });
      text = result.text;
      ai = result.fromAi;
    } catch {
      // fallback already set
    }
    const elapsed = Date.now() - started;
    if (elapsed < MIN_REACTION_MS) await sleep(MIN_REACTION_MS - elapsed);

    setReaction(text);
    setFromAi(ai);
    setReactionState("done");
  }, [mod, inputs, roundKey, locale]);

  const selectPosture = useCallback(
    (key: PostureKey) => {
      setPosture(key);
      if (mod && band) {
        setCondition(resolveCondition(mod, band, key, numericInputs, locale));
      }
    },
    [mod, band, numericInputs, locale],
  );

  const submitLead = useCallback(async () => {
    if (!mod || !band || !posture || !condition || !roundKey) return;
    setSaving(true);
    setLeadError(null);
    const journey: JourneySnapshot = {
      moduleId: mod.id,
      archetype: mod.archetype,
      metric: mod.metric,
      roundKey,
      inputs: numericInputs,
      band,
      posture,
      reaction: reaction ?? "",
      condition,
      automationFix: pick(mod.automationFix, locale),
    };
    const result = await savePitchLead({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      concern: lead.concern,
      journey,
    });
    setSaving(false);
    if (result.ok) {
      setSavedId(result.id);
      setPhase("done");
    } else {
      setLeadError(result.error);
    }
  }, [mod, band, posture, condition, roundKey, lead, numericInputs, reaction, locale]);

  const beat = beatIndex(phase);
  const inMeeting = phase !== "setup" && phase !== "done";
  const accent = archetype ? ACCENTS[archetype] : null;
  const fieldAdornment = (kind: PitchModule["fields"][number]["kind"]) =>
    kind === "usd" ? { prefix: "$" } : kind === "pct" ? { suffix: "%" } : {};

  return (
    <div className={`${cardClass} relative overflow-hidden`}>
      {/* ambient glow behind the card content */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-0 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-mp-pulse/[0.05] blur-3xl"
      />

      {/* ── Meeting frame top bar ─────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative" aria-hidden>
            <div className="absolute -inset-1 rounded-full bg-mp-pulse/20 blur-[6px]" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-[#0d0f12]">
              {INVESTOR.initials}
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{INVESTOR.name}</p>
              {inMeeting && (
                <span className="flex items-center gap-1.5 rounded-full border border-mp-pulse/30 bg-mp-pulse/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mp-pulse">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mp-pulse opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mp-pulse" />
                  </span>
                  {pick(GAME_UI.live, locale)}
                </span>
              )}
            </div>
            <p className="mp-text-ticker text-foreground/40">
              {pick(INVESTOR.title, locale)} · {INVESTOR.firm}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitcher variant="compact" />
          {inMeeting ? (
            <div
              className={`flex items-center gap-1.5 font-mono text-sm tabular-nums ${
                secondsLeft < 60 ? "text-amber-300" : "text-foreground/70"
              }`}
              aria-label="Meeting time remaining"
            >
              <Clock className="h-4 w-4" />
              {formatTimer(secondsLeft)}
            </div>
          ) : (
            <span className="mp-text-ticker text-foreground/40">
              {SETUP_COPY.meetingLength}
            </span>
          )}
        </div>
      </div>

      {/* ── Progress rail ──────────────────────────────────────── */}
      {beat >= 0 && (
        <div className="relative z-10 border-b border-white/10 px-4 py-2.5 sm:px-6">
          <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Meeting progress">
            {BEATS.map((label, i) => (
              <li key={i} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                <span
                  className={`mp-text-ticker hidden whitespace-nowrap sm:inline ${
                    i === beat
                      ? "text-mp-pulse"
                      : i < beat
                        ? "text-foreground/50"
                        : "text-foreground/25"
                  }`}
                >
                  {pick(label, locale)}
                </span>
                <span
                  aria-hidden
                  className={`h-1.5 w-full shrink-0 rounded-full transition-colors ${
                    i < beat
                      ? "bg-mp-pulse/60"
                      : i === beat
                        ? "bg-mp-pulse"
                        : "bg-white/10"
                  }`}
                />
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-auto w-full max-w-2xl"
          >
            {phase === "setup" && (
              <div className="py-4 text-center sm:py-8">
                <p className="mp-text-ticker mb-3 text-mp-pulse">
                  — {pick(SETUP_COPY.eyebrow, locale)} —
                </p>
                <h2 className="mx-auto max-w-xl text-2xl font-bold leading-tight sm:text-3xl">
                  <Rich text={pick(SETUP_COPY.title, locale)} boldClass="text-foreground" />
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-foreground/60 sm:text-base">
                  {pick(SETUP_COPY.subtitle, locale)}
                </p>
                <button type="button" onClick={startGame} className={`${primaryBtnClass} mt-8 px-8 py-3.5 text-base`}>
                  {pick(SETUP_COPY.cta, locale)}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-4 text-xs text-foreground/35">{pick(SETUP_COPY.hint, locale)}</p>
              </div>
            )}

            {phase === "archetype" && (
              <div>
                <StepLabel index="01" label={pick(GAME_UI.stepStory, locale)} />
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  {pick(GAME_UI.storyTitle, locale)}
                </h2>
                <p className="mt-1 text-sm text-foreground/55">{pick(GAME_UI.storySub, locale)}</p>
                <div className="mt-5 grid gap-3">
                  {(Object.keys(ARCHETYPES) as ArchetypeKey[]).map((key) => {
                    const a = ARCHETYPES[key];
                    const acc = ACCENTS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selectArchetype(key)}
                        className={`group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111318] p-4 text-left transition ${acc.cardBorder} ${acc.cardHover} active:scale-[0.99] mp-focus-pulse`}
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-2xl transition group-hover:scale-110 ${acc.chip}`}
                        >
                          {a.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                            {pick(a.title, locale)}
                            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${acc.dot}`} />
                          </span>
                          <span className="block text-xs text-foreground/50 sm:text-sm">
                            {pick(a.tagline, locale)}
                          </span>
                        </span>
                        <ChevronRight className="h-5 w-5 shrink-0 text-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-mp-pulse" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {phase === "metric" && archetype && (
              <div>
                <StepLabel index="02" label={pick(GAME_UI.stepStory, locale)} />
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  {ARCHETYPES[archetype].emoji}{" "}
                  <Rich text={pick(GAME_UI.metricTitle, locale)} />
                </h2>
                <p className="mt-1 text-sm text-foreground/55">{pick(GAME_UI.metricSub, locale)}</p>
                <div className="mt-5 grid gap-3">
                  {METRICS[archetype].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => selectMetric(m.key)}
                      className={`group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111318] p-4 text-left transition ${accent?.cardBorder} ${accent?.cardHover} active:scale-[0.99] mp-focus-pulse`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold sm:text-base">
                          {pick(m.title, locale)}
                        </span>
                        <span className="block text-xs text-foreground/50 sm:text-sm">
                          {pick(m.sub, locale)}
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-mp-pulse" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase === "round" && (
              <div>
                <StepLabel index="03" label={pick(GAME_UI.stepRound, locale)} />
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  {pick(GAME_UI.roundTitle, locale)}
                </h2>
                <p className="mt-1 text-sm text-foreground/55">{pick(GAME_UI.roundSub, locale)}</p>
                <div className="mt-5 grid gap-3">
                  {(Object.keys(ROUNDS) as RoundKey[]).map((key) => {
                    const r = ROUNDS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selectRound(key)}
                        className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111318] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.03] active:scale-[0.99] mp-focus-pulse"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold sm:text-base">
                            {pick(r.label, locale)}
                          </span>
                          <span className="block text-xs text-foreground/50 sm:text-sm">
                            {pick(r.sub, locale)}
                          </span>
                        </span>
                        <ChevronRight className="h-5 w-5 shrink-0 text-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-mp-pulse" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {phase === "question" && mod && roundKey && (
              <div>
                <StepLabel index="04" label={pick(GAME_UI.openStep, locale)} />
                <div className="mt-4 flex items-start gap-3">
                  <div
                    aria-hidden
                    className="relative mt-0.5 h-8 w-8 shrink-0"
                  >
                    <div className="absolute -inset-1 rounded-full bg-mp-pulse/20 blur-[5px]" />
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-[10px] font-bold text-[#0d0f12]">
                      {INVESTOR.initials}
                    </div>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>{pick(ROUNDS[roundKey].leadIn, locale)}</p>
                    <p className="mt-2">{pick(mod.opening, locale)}</p>
                    <p className="mt-3 font-semibold text-foreground">
                      <Rich text={`“${pick(mod.question, locale)}”`} />
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={() => setPhase("data")} className={primaryBtnClass}>
                    {pick(GAME_UI.bringNumbers, locale)}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {phase === "data" && mod && (
              <div>
                <StepLabel index="05" label={pick(GAME_UI.stepNumbers, locale)} />
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  {pick(GAME_UI.dataTitle, locale)}
                </h2>
                <p className="mt-1 text-sm text-foreground/55">
                  <Rich
                    text={pick(GAME_UI.dataSub, locale).replace(
                      "{metric}",
                      `**${pick(
                        METRICS[mod.archetype].find((m) => m.key === mod.metric)?.title ?? ({} as Bi),
                        locale,
                      )}**`,
                    )}
                  />
                </p>
                <div className="mt-5 grid gap-4">
                  {mod.fields.map((field) => {
                    const adorn = fieldAdornment(field.kind);
                    return (
                      <label key={field.key} className="block">
                        <span className="text-sm font-medium text-foreground/80">
                          {pick(field.label, locale)}
                        </span>
                        <span className="relative mt-1.5 block">
                          {adorn.prefix && (
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-foreground/40">
                              {adorn.prefix}
                            </span>
                          )}
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={inputs[field.key] ?? ""}
                            onChange={(e) =>
                              setInputs((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            placeholder={pick(field.placeholder, locale)}
                            className={`${inputClass} ${adorn.prefix ? "pl-7" : ""} ${
                              adorn.suffix ? "pr-9" : ""
                            } ${inputErrors[field.key] ? "border-red-400/60" : ""}`}
                            aria-invalid={Boolean(inputErrors[field.key])}
                          />
                          {adorn.suffix && (
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-foreground/40">
                              {adorn.suffix}
                            </span>
                          )}
                        </span>
                        {inputErrors[field.key] && (
                          <span className="mt-1 block text-xs text-red-400">
                            {inputErrors[field.key]}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={submitData} className={primaryBtnClass}>
                    {pick(GAME_UI.showNumbers, locale)}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {phase === "reaction" && mod && band && (
              <div>
                <StepLabel index="06" label={pick(GAME_UI.stepReaction, locale)} />
                <div className="mt-4 flex items-start gap-3">
                  <div aria-hidden className="relative mt-0.5 h-8 w-8 shrink-0">
                    <div className="absolute -inset-1 rounded-full bg-mp-pulse/20 blur-[5px]" />
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-[10px] font-bold text-[#0d0f12]">
                      {INVESTOR.initials}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mp-text-ticker text-foreground/40">
                        {pick(GAME_UI.reading, locale)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${bandChipClass[band]}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${bandDotClass[band]}`} />
                        {pick(BAND_META[band].label, locale)}
                      </span>
                    </div>
                    <div className="mt-2 min-h-[7rem]">
                      {reactionState === "loading" ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <Loader className="h-4 w-4 animate-spin text-mp-pulse" />
                          <p className="text-sm text-foreground/60">
                            {pick(GAME_UI.doingMath, locale)}{" "}
                            <span className="inline-flex gap-1">
                              <span className="animate-bounce [animation-delay:0ms]">·</span>
                              <span className="animate-bounce [animation-delay:150ms]">·</span>
                              <span className="animate-bounce [animation-delay:300ms]">·</span>
                            </span>
                          </p>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-foreground/85 sm:text-base"
                        >
                          <Rich text={reaction ?? ""} />
                          {fromAi && (
                            <span className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wider text-foreground/30">
                              <Sparkles className="h-3 w-3" /> {pick(GAME_UI.aiRead, locale)}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
                {reactionState === "done" && (
                  <div className="mt-6 flex justify-end">
                    <button type="button" onClick={() => setPhase("posture")} className={primaryBtnClass}>
                      {pick(GAME_UI.playIt, locale)}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {phase === "posture" && mod && (
              <div>
                <StepLabel index="07" label={pick(GAME_UI.stepDefense, locale)} />
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  {pick(GAME_UI.defenseTitle, locale)}
                </h2>
                <p className="mt-1 text-sm text-foreground/55">{pick(GAME_UI.defenseSub, locale)}</p>
                <div className="mt-5 grid gap-3">
                  {(Object.keys(POSTURES) as PostureKey[]).map((key) => {
                    const p = POSTURES[key];
                    const pair = mod.postures[key];
                    const selected = posture === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selectPosture(key)}
                        className={`rounded-2xl border p-4 text-left transition mp-focus-pulse ${
                          selected
                            ? "border-mp-pulse/50 bg-mp-pulse/5"
                            : "border-white/10 bg-[#111318] hover:border-white/20 hover:bg-white/[0.03]"
                        } ${posture && !selected ? "opacity-60" : ""}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{pick(p.title, locale)}</span>
                          {selected && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-mp-pulse text-[10px] text-mp-pulse-foreground">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-foreground/50">{pick(p.sub, locale)}</span>
                        <span className="mt-3 block text-sm leading-relaxed text-foreground/85">
                          <Rich text={`“${pick(pair.founder, locale)}”`} />
                        </span>
                        <AnimatePresence initial={false}>
                          {selected && (
                            <motion.span
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="block overflow-hidden"
                            >
                              <span className="mt-3 block border-l-2 border-mp-pulse/50 pl-3 text-sm leading-relaxed text-foreground/70">
                                <span className="mp-text-ticker text-mp-pulse">
                                  {INVESTOR.name.split(" ")[0]}:
                                </span>{" "}
                                <Rich text={pick(pair.investor, locale)} />
                              </span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
                {posture && (
                  <div className="mt-6 flex justify-end">
                    <button type="button" onClick={() => setPhase("termsheet")} className={primaryBtnClass}>
                      {pick(GAME_UI.seeTermSheet, locale)}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {phase === "termsheet" && mod && band && condition && (
              <div>
                <StepLabel index="08" label={pick(GAME_UI.verdictStep, locale)} />
                <div className="mt-4 overflow-hidden rounded-2xl border border-yellow-400/25 bg-gradient-to-b from-[#14171c] to-[#111318]">
                  <div className="flex items-center justify-between border-b border-white/10 bg-yellow-400/[0.06] px-5 py-3">
                    <span className="mp-text-ticker text-yellow-300">
                      {pick(TERM_SHEET_COPY.heading, locale)}
                    </span>
                    <span className="mp-text-ticker text-foreground/30">
                      {pick(TERM_SHEET_COPY.illustrative, locale)}
                    </span>
                  </div>
                  <div className="px-5 py-5">
                    <p className="text-sm text-foreground/55">{pick(TERM_SHEET_COPY.line1, locale)}</p>
                    <p className="mt-2 text-lg font-semibold leading-snug text-foreground">
                      <Rich
                        text={condition}
                        highlightClass="font-semibold text-yellow-300"
                      />
                    </p>
                    <p className="mt-4 text-right font-mono text-xs text-foreground/40">
                      {pick(TERM_SHEET_COPY.signature, locale)} · {INVESTOR.firm}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/80" />
                  <p className="text-xs leading-relaxed text-amber-200/70">
                    {pick(TERM_SHEET_COPY.disclaimer, locale)}
                  </p>
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={() => setPhase("handoff")} className={primaryBtnClass}>
                    {pick(GAME_UI.worthConversation, locale)}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {phase === "handoff" && mod && (
              <div>
                <StepLabel index="09" label={pick(GAME_UI.handoffStep, locale)} />
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  {pick(HANDOFF_COPY.heading, locale)}
                </h2>
                <div className="mt-3 flex items-start gap-3 rounded-2xl border border-mp-pulse/25 bg-mp-pulse/5 p-4">
                  <Target className="mt-0.5 h-5 w-5 shrink-0 text-mp-pulse" />
                  <p className="text-sm leading-relaxed text-foreground/85">
                    <Rich
                      text={pick(HANDOFF_COPY.body, locale).replace(
                        "{specialist}",
                        `**${pick(SPECIALIST.name, locale)}**`,
                      )}
                    />
                  </p>
                </div>
                <p className="mt-4 text-sm font-medium text-foreground/80">
                  {pick(HANDOFF_COPY.formTitle, locale)}
                </p>
                <form
                  className="mt-3 grid gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitLead();
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-foreground/60">
                        {pick(GAME_UI.name, locale)}{" "}
                        <span className="text-foreground/35">({pick(GAME_UI.optionalLabel, locale)})</span>
                      </span>
                      <input
                        className={`${inputClass} mt-1`}
                        value={lead.name}
                        onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))}
                        placeholder="Ada Lovelace"
                        autoComplete="name"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-foreground/60">
                        {pick(GAME_UI.workEmail, locale)}{" "}
                        <span className="text-foreground/35">({pick(GAME_UI.optionalLabel, locale)})</span>
                      </span>
                      <input
                        type="email"
                        className={`${inputClass} mt-1`}
                        value={lead.email}
                        onChange={(e) => setLead((l) => ({ ...l, email: e.target.value }))}
                        placeholder="ada@company.com"
                        autoComplete="email"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-foreground/60">
                        {pick(GAME_UI.phone, locale)}{" "}
                        <span className="text-foreground/35">({pick(GAME_UI.optionalLabel, locale)})</span>
                      </span>
                      <input
                        type="tel"
                        className={`${inputClass} mt-1`}
                        value={lead.phone}
                        onChange={(e) => setLead((l) => ({ ...l, phone: e.target.value }))}
                        placeholder="+852 9123 4567"
                        autoComplete="tel"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-foreground/60">
                        {pick(GAME_UI.company, locale)}{" "}
                        <span className="text-foreground/35">({pick(GAME_UI.optionalLabel, locale)})</span>
                      </span>
                      <input
                        className={`${inputClass} mt-1`}
                        value={lead.company}
                        onChange={(e) => setLead((l) => ({ ...l, company: e.target.value }))}
                        placeholder="Meridian Labs Ltd."
                        autoComplete="organization"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs font-medium text-foreground/60">
                      {pick(GAME_UI.concern, locale)}{" "}
                      <span className="text-foreground/35">{pick(GAME_UI.concernSub, locale)}</span>
                    </span>
                    <textarea
                      rows={2}
                      className={`${inputClass} mt-1 resize-none`}
                      value={lead.concern}
                      onChange={(e) => setLead((l) => ({ ...l, concern: e.target.value }))}
                      placeholder={pick(GAME_UI.concernPlaceholder, locale)}
                    />
                  </label>
                  {leadError && <p className="text-sm text-red-400">{leadError}</p>}
                  <div className="mt-1 flex justify-end">
                    <button type="submit" disabled={saving} className={primaryBtnClass}>
                      {saving ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" /> {pick(GAME_UI.sending, locale)}
                        </>
                      ) : (
                        <>
                          {pick(GAME_UI.getReadout, locale)}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-center text-[11px] text-foreground/35">
                    {pick(HANDOFF_COPY.privacyNote, locale)}
                  </p>
                </form>
              </div>
            )}

            {phase === "done" && mod && band && condition && (
              <div className="relative py-2 text-center sm:py-4">
                <ConfettiBurst />
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mp-pulse/15"
                >
                  <Check className="h-7 w-7 text-mp-pulse" />
                </motion.div>
                <h2 className="mt-4 text-2xl font-bold">{pick(HANDOFF_COPY.successTitle, locale)}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/60">
                  {pick(HANDOFF_COPY.successBody, locale)}
                </p>

                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#111318] text-left">
                  <div
                    className={`flex items-center justify-between border-b border-white/10 px-5 py-3 ${accent?.softBg}`}
                  >
                    <span className="mp-text-ticker text-mp-pulse">
                      {pick(GAME_UI.yourReadout, locale)}
                    </span>
                    <span className={`mp-text-ticker ${accent?.text ?? "text-foreground/40"}`}>
                      {ARCHETYPES[mod.archetype].emoji}
                    </span>
                  </div>
                  <dl className="divide-y divide-white/[0.06] px-5 text-sm">
                    <div className="flex items-start justify-between gap-4 py-3.5">
                      <dt className="shrink-0 text-foreground/50">{pick(GAME_UI.readoutPitch, locale)}</dt>
                      <dd className="text-right font-medium">
                        {pick(ARCHETYPES[mod.archetype].title, locale)} ·{" "}
                        {pick(
                          METRICS[mod.archetype].find((m) => m.key === mod.metric)?.title ??
                            ({} as Bi),
                          locale,
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4 py-3.5">
                      <dt className="shrink-0 text-foreground/50">{pick(GAME_UI.readoutVerdict, locale)}</dt>
                      <dd>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${bandChipClass[band]}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${bandDotClass[band]}`} />
                          {pick(BAND_META[band].label, locale)}
                        </span>
                      </dd>
                    </div>
                    <div className="py-3.5">
                      <dt className="text-foreground/50">{pick(GAME_UI.readoutCondition, locale)}</dt>
                      <dd className="mt-1.5 leading-relaxed text-foreground/85">
                        <Rich text={condition} />
                      </dd>
                    </div>
                    <div className={`rounded-b-2xl py-3.5 ${accent?.softBg ?? ""}`}>
                      <dt className={`flex items-center gap-1.5 ${accent?.text ?? "text-mp-pulse"}`}>
                        <Target className="h-3.5 w-3.5" /> {pick(GAME_UI.readoutGap, locale)}
                      </dt>
                      <dd className="mt-1.5 leading-relaxed text-foreground/85">
                        <Rich text={pick(mod.automationFix, locale)} />
                      </dd>
                    </div>
                  </dl>
                </div>

                {savedId && (
                  <p className="mt-3 text-xs text-foreground/40">
                    {pick(HANDOFF_COPY.reference, locale).replace("{id}", savedId.slice(0, 8))}
                  </p>
                )}
                <button type="button" onClick={restart} className={`${ghostBtnClass} mt-6`}>
                  {pick(GAME_UI.playAgain, locale)}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepLabel({ index, label }: { index: string; label: string }) {
  return (
    <p className="mp-text-ticker text-foreground/40">
      <span className="text-mp-pulse">{index}</span> / {label}
    </p>
  );
}

/** Small celebratory burst on the readout screen. */
function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 37 + 11) % 100,
        delay: (i % 7) * 0.06,
        duration: 0.9 + (i % 5) * 0.18,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: (i * 47) % 360,
        size: 5 + (i % 3) * 3,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, 60, 120],
            x: [0, (i % 2 === 0 ? 1 : -1) * (12 + (i % 4) * 8)],
            rotate: p.rotate + 180,
            scale: [0.4, 1, 0.9, 0.6],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          className="absolute"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: i % 3 === 0 ? "9999px" : "2px",
          }}
        />
      ))}
    </div>
  );
}
