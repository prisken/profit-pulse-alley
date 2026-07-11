import { describe, expect, it } from "vitest";

import { enMessages } from "@/lib/i18n/messages/en";
import { zhHantMessages } from "@/lib/i18n/messages/zh-Hant";
import {
  marketPulseEnMessages,
  marketPulseZhHantMessages,
} from "@/lib/i18n/messages/market-pulse-messages";
import { MARKET_PULSE_LAUNCH_MESSAGES } from "@/lib/market-pulse/launch-config";

const BANNED_DEMO_PATTERN = /\bdemo\b/i;

const BANNED_PUBLIC_COPY = [
  /launching soon/i,
  /coming soon/i,
  /\bpre-launch\b/i,
  /admin test/i,
  BANNED_DEMO_PATTERN,
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

const REQUIRED_CYCLE_REVEAL_COPY: ReadonlyArray<{
  key: keyof typeof marketPulseEnMessages;
  en: string;
  zh: string;
}> = [
  { key: "mp.common.tbc", en: "TBC", zh: "待定" },
  { key: "mp.common.nextCycle", en: "Next cycle", zh: "下一期" },
  { key: "mp.common.nextCycleTbc", en: "Next cycle: TBC", zh: "下一期：待定" },
  {
    key: "mp.common.nextChallengeTbc",
    en: "Next challenge: TBC",
    zh: "下一個挑戰：待定",
  },
  {
    key: "mp.reveal.review.title",
    en: "Your cycle review",
    zh: "你的本期回顧",
  },
  {
    key: "mp.reveal.review.playedSummary",
    en: "You played {played} of {total} cards.",
    zh: "你完成了 {played} / {total} 張卡牌。",
  },
  { key: "mp.reveal.card.played", en: "Played", zh: "已參與" },
  { key: "mp.reveal.card.notPlayed", en: "Not played", zh: "未參與" },
  { key: "mp.reveal.card.yourCall", en: "Your choice", zh: "你的選擇" },
  { key: "mp.reveal.card.ppaSignal", en: "PPA signal", zh: "PPA 訊號" },
  { key: "mp.reveal.card.ppaInsight", en: "PPA insight", zh: "PPA 洞察" },
  { key: "mp.reveal.card.match", en: "Matched PPA", zh: "與 PPA 一致" },
  {
    key: "mp.reveal.card.noMatch",
    en: "Different from PPA",
    zh: "與 PPA 不同",
  },
  {
    key: "mp.reveal.card.skippedHint",
    en: "You did not play this card, so it does not count toward your score.",
    zh: "你沒有參與此卡牌，因此不會計入你的分數。",
  },
  {
    key: "mp.reveal.noParticipation.title",
    en: "You did not play this cycle",
    zh: "你未有參與本期挑戰",
  },
  {
    key: "mp.reveal.noParticipation.body",
    en: "This cycle has been revealed, but we could not find any locked choices for your account. You can still review the PPA insights below.",
    zh: "本期結果已揭曉，但我們找不到此帳戶已鎖定的選擇。你仍可在下方查看 PPA 洞察。",
  },
  { key: "mp.reveal.card.scorePending", en: "Score pending", zh: "分數待確認" },
  { key: "mp.cardType.rest", en: "Market rest card", zh: "市場休息卡" },
  {
    key: "mp.play.completion.acknowledged",
    en: "Participation claimed",
    zh: "已領取參與分",
  },
  {
    key: "mp.reveal.card.restNotClaimed",
    en: "Rest card not claimed",
    zh: "未領取休息卡",
  },
  {
    key: "mp.common.nextCycleTbcBody",
    en: "Next cycle is TBC. Check back soon for the next Market Pulse challenge.",
    zh: "下一期暫定，請稍後回來查看新的 Market Pulse 挑戰。",
  },
  {
    key: "mp.leaderboard.myScore.viewCycleReview",
    en: "View cycle review",
    zh: "查看本期回顧",
  },
];

function isMarketPulseHomeKey(key: string): boolean {
  return (
    key.startsWith("home.hero.") ||
    key.startsWith("home.pipeline.") ||
    key.startsWith("home.pulseBoard.") ||
    key.startsWith("home.rewards.") ||
    key.startsWith("home.finalCta.") ||
    key.startsWith("home.countdown.") ||
    key.startsWith("home.ppaInsight.") ||
    key.startsWith("home.playLearnWin.prize.") ||
    key.startsWith("announcement.") ||
    key.startsWith("legal.contest.prizes")
  );
}

function isSimulatorHomeKey(key: string): boolean {
  return key.startsWith("home.hero.simulator.");
}

function matchesBannedPublicCopy(key: string, value: string): boolean {
  for (const pattern of BANNED_PUBLIC_COPY) {
    if (pattern === BANNED_DEMO_PATTERN && isSimulatorHomeKey(key)) {
      continue;
    }
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

const REQUIRED_HOMEPAGE_COPY_KEYS = [
  "home.pipeline.step1.body",
  "home.pipeline.step4.body",
  "home.pipeline.prize.body",
  "home.pulseBoard.locked.message",
  "home.pulseBoard.sample.badge",
  "home.pulseBoard.sample.note",
  "home.rewards.prize.body",
  "home.rewards.ppa.lockedNote",
  "home.finalCta.exploreHub",
] as const;

const REMOVED_HOMEPAGE_COPY_KEYS = [
  "home.howItWorks.title",
  "home.cycleLoop.title",
  "home.finalCta.playGuest",
] as const;

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
        if (matchesBannedPublicCopy(key, value)) {
          offenders.push(`${key}: ${value}`);
        }
      }

      expect(offenders).toEqual([]);
    });
  }

  it("keeps homepage simulator copy clearly labeled and non-submitting", () => {
    expect(enMessages["home.hero.simulator.title"]).toMatch(/simulator/i);
    expect(enMessages["home.hero.simulator.badgeDemo"]).toMatch(/demo/i);
    expect(enMessages["home.hero.simulator.feedbackLocked"]).toMatch(
      /demo stance locked/i,
    );
    expect(enMessages["home.hero.simulator.disclaimer"]).toMatch(
      /not saved|not scored/i,
    );
    expect(zhHantMessages["home.hero.simulator.disclaimer"]).toMatch(
      /不會儲存|不會計分/,
    );
  });

  it("keeps revamp homepage copy keys present in EN and zh-Hant", () => {
    for (const key of REQUIRED_HOMEPAGE_COPY_KEYS) {
      expect(enMessages[key]).toBeTruthy();
      expect(zhHantMessages[key]).toBeTruthy();
    }
  });

  it("removes deprecated homepage section copy keys", () => {
    for (const key of REMOVED_HOMEPAGE_COPY_KEYS) {
      expect(enMessages).not.toHaveProperty(key);
      expect(zhHantMessages).not.toHaveProperty(key);
    }
  });

  it("keeps pulse board privacy copy for locked and sample states", () => {
    expect(enMessages["home.pulseBoard.locked.message"]).toMatch(/reveal/i);
    expect(enMessages["home.pulseBoard.sample.badge"]).toMatch(/sample/i);
    expect(enMessages["home.pulseBoard.sample.note"]).toMatch(/not live/i);
    expect(enMessages["home.pulseBoard.sample.player1"]).toMatch(/sample/i);
    expect(zhHantMessages["home.pulseBoard.sample.player1"]).toMatch(/示範/);
    expect(zhHantMessages["home.pulseBoard.locked.message"]).toMatch(/公布/);
  });

  it("describes PPA as post-reveal without exposing insight content on homepage", () => {
    expect(enMessages["home.rewards.ppa.lockedNote"]).toMatch(/unlock/i);
    expect(enMessages["home.rewards.ppa.body"]).toMatch(/after reveal/i);
    expect(enMessages["home.rewards.ppa.body"]).not.toMatch(
      /momentum|risk|valuation|bullish|cautious/i,
    );
    expect(zhHantMessages["home.rewards.ppa.lockedNote"]).toMatch(/解鎖/);
  });

  it("keeps One Ocean Park ticket prize copy in EN and zh-Hant", () => {
    expect(marketPulseEnMessages["mp.prize.heading"]).toBeTruthy();
    expect(enMessages["home.pipeline.prize.body"]).toContain("One Ocean Park ticket");
    expect(enMessages["home.rewards.prize.body"]).toContain("One Ocean Park ticket");
    expect(zhHantMessages["home.playLearnWin.prize.text"]).toContain("海洋公園");
    expect(zhHantMessages["home.rewards.prize.body"]).toContain("海洋公園");
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

    expect(enMessages["home.pipeline.scoring.rest"]).toMatch(/rest card/i);
    expect(zhHantMessages["home.pipeline.scoring.rest"]).toMatch(/休息卡/);
  });

  it("keeps cycle review, reveal, and next-cycle TBC copy in EN and zh-Hant", () => {
    for (const { key, en, zh } of REQUIRED_CYCLE_REVEAL_COPY) {
      expect(marketPulseEnMessages[key]).toBe(en);
      expect(marketPulseZhHantMessages[key]).toBe(zh);
    }

    expect(marketPulseEnMessages["mp.hub.lobby.nextCycle.tbc"]).toBe(
      "Next cycle: TBC",
    );
    expect(marketPulseZhHantMessages["mp.hub.lobby.nextCycle.tbc"]).toBe(
      "下一期：待定",
    );
    expect(marketPulseEnMessages["mp.play.state.nextChallenge.tbc"]).toBe(
      "Next challenge: TBC",
    );
    expect(marketPulseZhHantMessages["mp.play.state.nextChallenge.tbc"]).toBe(
      "下一個挑戰：待定",
    );
  });
});
