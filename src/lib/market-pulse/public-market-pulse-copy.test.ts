import { describe, expect, it } from "vitest";

import { enMessages } from "@/lib/i18n/messages/en";
import { zhHantMessages } from "@/lib/i18n/messages/zh-Hant";
import {
  marketPulseEnMessages,
  marketPulseZhHantMessages,
} from "@/lib/i18n/messages/market-pulse-messages";
import { MARKET_PULSE_LAUNCH_MESSAGES } from "@/lib/market-pulse/launch-config";

const BANNED_PUBLIC_COPY = [
  /launching soon/i,
  /coming soon/i,
  /\bpre-launch\b/i,
  /admin test/i,
  /\bdemo\b/i,
  /\bseed\b/i,
  /\bplaceholder\b/i,
  /\bdevelopment\b/i,
  /first public cycle/i,
  /July 1, 2026/i,
  /2026年7月1日/,
  /opens on July/i,
  /將於.*開放/,
  /即將開放/,
  /即將推出/,
  /fictional startup/i,
  /虛構的初創/,
  /virtual capital/i,
  /虛擬資本/,
  /in-game timeline/i,
  /遊戲時間軸/,
  /educational simulation/i,
  /教育性模擬/,
];

const REQUIRED_REST_COPY_KEYS = [
  "mp.rest.badge",
  "mp.rest.noSignalToday",
  "mp.rest.claimParticipation",
  "mp.rest.success.locked",
  "mp.rest.participationOnlyNote",
  "mp.rest.noPredictionRequired",
  "mp.rules.section.restDays",
  "mp.rules.section.scoringRestCard",
  "mp.scoring.restCard",
  "mp.cardType.rest",
] as const;

const REQUIRED_SCORING_COPY_KEYS = [
  "mp.rules.section.scoringSignalParticipation",
  "mp.rules.section.scoringSignalMatch",
  "mp.rules.section.scoringSignalStreak",
  "mp.scoring.signalParticipation",
  "mp.scoring.signalMatch",
  "mp.scoring.signalStreak",
] as const;

function isMarketPulseHomeKey(key: string): boolean {
  return (
    key.startsWith("home.hero.") ||
    key.startsWith("home.howItWorks.") ||
    key.startsWith("home.finalCta.") ||
    key.startsWith("home.countdown.") ||
    key.startsWith("home.cycleLoop.") ||
    key.startsWith("home.ppaInsight.") ||
    key.startsWith("home.playLearnWin.prize.") ||
    key.startsWith("announcement.") ||
    key.startsWith("legal.contest.prizes")
  );
}

function pickMarketPulseHomeMessages(
  source: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => isMarketPulseHomeKey(key)),
  );
}

const PUBLIC_MESSAGE_SOURCES = [
  { name: "marketPulseEnMessages", messages: marketPulseEnMessages },
  { name: "marketPulseZhHantMessages", messages: marketPulseZhHantMessages },
  {
    name: "homeEn",
    messages: pickMarketPulseHomeMessages(enMessages),
  },
  {
    name: "homeZhHant",
    messages: pickMarketPulseHomeMessages(zhHantMessages),
  },
];

describe("public Market Pulse production copy", () => {
  for (const { name, messages } of PUBLIC_MESSAGE_SOURCES) {
    it(`${name} avoids stale launch/dev terms`, () => {
      const offenders: string[] = [];

      for (const [key, value] of Object.entries(messages)) {
        for (const pattern of BANNED_PUBLIC_COPY) {
          if (pattern.test(value)) {
            offenders.push(`${key}: ${value}`);
            break;
          }
        }
      }

      expect(offenders).toEqual([]);
    });
  }

  it("keeps One Ocean Park ticket prize copy in EN and zh-Hant", () => {
    expect(marketPulseEnMessages["mp.prize.heading"]).toBeTruthy();
    expect(enMessages["home.cycleLoop.prize.body"]).toContain("One Ocean Park ticket");
    expect(zhHantMessages["home.playLearnWin.prize.text"]).toContain("海洋公園");
    expect(MARKET_PULSE_LAUNCH_MESSAGES.en.prize).toContain("One Ocean Park ticket");
    expect(MARKET_PULSE_LAUNCH_MESSAGES["zh-HK"].prize).toContain("海洋公園");
  });

  it("keeps accurate locked and pending state copy", () => {
    expect(marketPulseEnMessages["mp.leaderboard.state.lockedTitle"]).toMatch(
      /reveal/i,
    );
    expect(marketPulseEnMessages["mp.reveal.pending.title"]).toMatch(/PPA Insight/i);
    expect(marketPulseEnMessages["mp.play.state.signIn.title"]).toMatch(/Sign in/i);
    expect(marketPulseEnMessages["mp.play.status.noCardTitle"]).toMatch(
      /prepared|signal/i,
    );
  });

  it("describes swipe-card rules and market rest days (not legacy arcade simulation)", () => {
    const whatIs = marketPulseEnMessages["mp.rules.section.whatIsBody"];
    expect(whatIs).toMatch(/signal cards/i);
    expect(whatIs).not.toMatch(/fictional startup|virtual capital|simulation/i);

    const whatIsZh = marketPulseZhHantMessages["mp.rules.section.whatIsBody"];
    expect(whatIsZh).toMatch(/訊號卡片/);
    expect(whatIsZh).not.toMatch(/虛構|虛擬資本|模擬/);

    for (const key of REQUIRED_REST_COPY_KEYS) {
      expect(marketPulseEnMessages[key]).toBeTruthy();
      expect(marketPulseZhHantMessages[key]).toBeTruthy();
    }

    for (const key of REQUIRED_SCORING_COPY_KEYS) {
      expect(marketPulseEnMessages[key]).toMatch(/\+?\{?points\}?|參與|participation/i);
      expect(marketPulseZhHantMessages[key]).toBeTruthy();
    }

    expect(enMessages["home.cycleLoop.scoring.rest"]).toMatch(/rest card/i);
    expect(zhHantMessages["home.cycleLoop.scoring.rest"]).toMatch(/休息卡/);
  });
});
