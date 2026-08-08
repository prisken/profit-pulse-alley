/**
 * The Pitch Meeting — content bank (bilingual EN / zh-Hant).
 *
 * Everything a player can read or tap is authored here, once. The only
 * generative surface area is one narrow, fact-constrained AI sentence in
 * Phase 5 (see actions.ts) — and it has a full deterministic fallback.
 *
 * Deterministic logic (banding, condition lookup) lives in logic.ts.
 */

/** Bilingual string pair. */
export type Bi = { en: string; zhHant: string };

export type ArchetypeKey =
  | "growth-engine"
  | "strained-ops"
  | "margin-play"
  | "team-ceiling"
  | "market-timing";

export type MetricKey =
  | "leads"
  | "close-rate"
  | "deal-size"
  | "delivery"
  | "support"
  | "hiring"
  | "gross-margin"
  | "cac"
  | "op-leverage"
  | "founder-bottleneck"
  | "missing-function"
  | "turnover"
  | "window"
  | "regulatory"
  | "behavior";

export type RoundKey = "bootstrapped" | "grow" | "survive" | "curious";

export type PostureKey = "defend" | "own-gap" | "reframe";

export type BandKey = "green" | "amber" | "red";

/** Raw user-entered numbers, keyed by field.key. */
export type NumericInputs = Record<string, number>;

export type FieldSpec = {
  key: string;
  label: Bi;
  placeholder: Bi;
  /** "usd" → $ prefix, "pct" → % suffix, "raw" → plain number. */
  kind: "usd" | "pct" | "raw";
  hint?: Bi;
};

/** Deterministic severity rule. */
export type BandRule =
  | {
      kind: "threshold";
      field: string;
      /** Higher-is-better unless invert: true (then lower is better). */
      green: number;
      amber: number;
      invert?: boolean;
    }
  | {
      kind: "ratio";
      numerator: string;
      denominator: string;
      green: number;
      amber: number;
    };

/**
 * Optional secondary condition: value below `below` OR above `above` drops
 * one band (e.g. strong close rate but too few leads → amber).
 */
export type DowngradeRule = { field: string; below?: number; above?: number };

export type PosturePair = {
  /** The founder's line (what the player would say). */
  founder: Bi;
  /** The investor's pre-written comeback. */
  investor: Bi;
};

export type ConditionVariant = {
  /** Restrict to these bands/postures; omitted = any. */
  bands?: BandKey[];
  postures?: PostureKey[];
  text: Bi;
};

export type PitchModule = {
  id: string;
  archetype: ArchetypeKey;
  metric: MetricKey;
  /** Investor's warm opener (Phase 3), shown after the round lead-in. */
  opening: Bi;
  /** The actual due-diligence question. */
  question: Bi;
  fields: FieldSpec[];
  rule: BandRule;
  downgrade?: DowngradeRule;
  postures: Record<PostureKey, PosturePair>;
  /** Term-sheet conditions; first matching (band × posture) wins. */
  conditions: ConditionVariant[];
  /**
   * Deterministic reaction lines per band. Templates may use:
   * {fieldKey}, {green:fieldKey}, {amber:fieldKey}, {ratio}, {green:ratio}.
   */
  fallbacks: Record<BandKey, Bi>;
  /** The automation gap this module exposes — used in handoff + readout. */
  automationFix: Bi;
};

export const INVESTOR = {
  name: "Elena Vásquez",
  firm: "Meridian Capital",
  initials: "EV",
  title: { en: "Partner", zhHant: "合夥人" } satisfies Bi,
};

export const SPECIALIST = {
  name: {
    en: "the Profit Pulse Ally automation team",
    zhHant: "Profit Pulse Ally 自動化團隊",
  } satisfies Bi,
};

export const SETUP_COPY = {
  eyebrow: { en: "PITCH MEETING", zhHant: "提案會議" } satisfies Bi,
  title: {
    en: "An investor has **20 minutes** and a **checkbook**.",
    zhHant: "投資者有**20分鐘**，口袋裏有一本**支票簿**。",
  } satisfies Bi,
  subtitle: {
    en: "Let's find out what it takes to get the **check** — and what you'd need to **automate** to be ready for it.",
    zhHant:
      "我們來看看，要拿到這張**支票**需要甚麼條件——以及你要**自動化**哪些環節，才有資格坐進這場會議。",
  } satisfies Bi,
  cta: { en: "Start the meeting", zhHant: "開始會議" } satisfies Bi,
  meetingLength: "20:00",
  hint: {
    en: "Three minutes, six taps, no typing until the numbers.",
    zhHant: "三分鐘、六次點按，到數字環節前都不用打字。",
  } satisfies Bi,
};

export const ARCHETYPES: Record<
  ArchetypeKey,
  { emoji: string; title: Bi; tagline: Bi }
> = {
  "growth-engine": {
    emoji: "🚀",
    title: { en: "Growth Engine", zhHant: "增長引擎" },
    tagline: { en: "Our engine works, we need fuel", zhHant: "引擎已經運轉，我們需要燃料" },
  },
  "strained-ops": {
    emoji: "🧩",
    title: { en: "Proven Product, Strained Ops", zhHant: "產品成熟、營運吃緊" },
    tagline: {
      en: "Product's proven, ops can't keep pace",
      zhHant: "產品已被驗證，營運卻追不上",
    },
  },
  "margin-play": {
    emoji: "💰",
    title: { en: "Margin Play", zhHant: "利潤機器" },
    tagline: {
      en: "A profit machine, not a growth chase",
      zhHant: "我們建造印鈔機，不是追逐增長",
    },
  },
  "team-ceiling": {
    emoji: "👥",
    title: { en: "Team Ceiling", zhHant: "團隊上限" },
    tagline: {
      en: "We've outgrown our current team",
      zhHant: "我們已超越現有團隊的承載力",
    },
  },
  "market-timing": {
    emoji: "⏱️",
    title: { en: "Market Timing", zhHant: "市場時機" },
    tagline: { en: "The window is open now", zhHant: "窗口現在敞開" },
  },
};

export const METRICS: Record<
  ArchetypeKey,
  { key: MetricKey; title: Bi; sub: Bi }[]
> = {
  "growth-engine": [
    {
      key: "leads",
      title: { en: "Pipeline volume", zhHant: "潛在客戶量" },
      sub: { en: "Leads in, every month", zhHant: "每月進來的潛在客戶" },
    },
    {
      key: "close-rate",
      title: { en: "Close rate", zhHant: "成交率" },
      sub: { en: "The conversion story", zhHant: "轉化的故事" },
    },
    {
      key: "deal-size",
      title: { en: "Deal size", zhHant: "平均交易額" },
      sub: { en: "Average ticket", zhHant: "平均客單價" },
    },
  ],
  "strained-ops": [
    {
      key: "delivery",
      title: { en: "Delivery capacity", zhHant: "交付產能" },
      sub: { en: "On time, or falling behind", zhHant: "準時交付，還是開始落後" },
    },
    {
      key: "support",
      title: { en: "Support load", zhHant: "支援工作量" },
      sub: { en: "Tickets vs. the team", zhHant: "工單數量對比團隊規模" },
    },
    {
      key: "hiring",
      title: { en: "Hiring pace", zhHant: "招聘速度" },
      sub: { en: "Demand vs. seats filled", zhHant: "需求對比已填補的職位" },
    },
  ],
  "margin-play": [
    {
      key: "gross-margin",
      title: { en: "Gross margin", zhHant: "毛利率" },
      sub: { en: "The unit economics", zhHant: "單位經濟模型" },
    },
    {
      key: "cac",
      title: { en: "CAC efficiency", zhHant: "獲客成本效率" },
      sub: { en: "Cost to acquire a customer", zhHant: "獲取一個客戶的成本" },
    },
    {
      key: "op-leverage",
      title: { en: "Operating leverage", zhHant: "營運槓桿" },
      sub: { en: "Revenue vs. cost growth", zhHant: "收入增長對比成本增長" },
    },
  ],
  "team-ceiling": [
    {
      key: "founder-bottleneck",
      title: { en: "Founder as bottleneck", zhHant: "創辦人成為瓶頸" },
      sub: { en: "Every decision stops at you", zhHant: "所有決定都在你這裏停下" },
    },
    {
      key: "missing-function",
      title: { en: "Missing key function", zhHant: "關鍵職能缺失" },
      sub: { en: "The chair that should exist", zhHant: "那個本應存在的席位" },
    },
    {
      key: "turnover",
      title: { en: "Key-role turnover", zhHant: "核心崗位流失" },
      sub: { en: "People leaving the core", zhHant: "核心團隊的人正在離開" },
    },
  ],
  "market-timing": [
    {
      key: "window",
      title: { en: "Competitive window", zhHant: "競爭窗口" },
      sub: { en: "How long is the runway?", zhHant: "跑道還有多長？" },
    },
    {
      key: "regulatory",
      title: { en: "Regulatory / tech shift", zhHant: "監管／技術變局" },
      sub: { en: "The rule-change moment", zhHant: "規則改變的時刻" },
    },
    {
      key: "behavior",
      title: { en: "Customer behavior shift", zhHant: "客戶行為轉變" },
      sub: { en: "Demand moving your way", zhHant: "需求正流向你" },
    },
  ],
};

export const ROUNDS: Record<RoundKey, { label: Bi; sub: Bi; leadIn: Bi }> = {
  bootstrapped: {
    label: { en: "Bootstrapped, proud of it", zhHant: "自資經營，引以為傲" },
    sub: {
      en: "No outside money yet — and you like it that way",
      zhHant: "從未拿過外部資金——而且你享受這種狀態",
    },
    leadIn: {
      en: "Bootstrapped and proud — that's a profile I genuinely like writing checks into.",
      zhHant: "自資經營、引以為傲——這正是我真心想開支票的創業者類型。",
    },
  },
  grow: {
    label: { en: "Raising to grow faster", zhHant: "融資加速增長" },
    sub: {
      en: "The engine works; you want fuel",
      zhHant: "引擎已運轉，你想要燃料",
    },
    leadIn: {
      en: "Raising to scale — the classic ask, and the one I take most seriously.",
      zhHant: "融資擴張——最經典的請求，也是我最認真看待的一種。",
    },
  },
  survive: {
    label: { en: "Raising to survive", zhHant: "融資求生" },
    sub: {
      en: "Runway is the story right now",
      zhHant: "現金跑道就是現在的故事",
    },
    leadIn: {
      en: "Running a tighter runway than you'd like — respect for the honesty. Let's look at the numbers.",
      zhHant: "現金跑道比你期望的更緊——佩服你的坦誠。我們來看看數字。",
    },
  },
  curious: {
    label: { en: "Not raising — just curious", zhHant: "暫不融資——純粹好奇" },
    sub: {
      en: "You want the honest read",
      zhHant: "你想要一個誠實的評價",
    },
    leadIn: {
      en: "Not raising — even better. You'll get the unfiltered read either way.",
      zhHant: "暫不融資——更好。無論如何，你都會得到不加修飾的評價。",
    },
  },
};

export const BAND_META: Record<BandKey, { label: Bi; chip: Bi }> = {
  green: {
    label: { en: "Solid", zhHant: "穩健" },
    chip: { en: "signal green", zhHant: "訊號綠" },
  },
  amber: {
    label: { en: "Workable", zhHant: "可接受" },
    chip: { en: "signal amber", zhHant: "訊號黃" },
  },
  red: {
    label: { en: "Fragile", zhHant: "脆弱" },
    chip: { en: "signal red", zhHant: "訊號紅" },
  },
};

export const POSTURES: Record<PostureKey, { title: Bi; sub: Bi }> = {
  defend: {
    title: { en: "Defend the number", zhHant: "捍衛數字" },
    sub: {
      en: "The data is better than it looks — explain why",
      zhHant: "數據比表面好——解釋原因",
    },
  },
  "own-gap": {
    title: { en: "Own the gap", zhHant: "坦承差距" },
    sub: {
      en: "It's a real weakness — and you know the fix",
      zhHant: "這是真正的弱點——而且你知道解法",
    },
  },
  reframe: {
    title: { en: "Reframe", zhHant: "轉換視角" },
    sub: {
      en: "Wrong metric, right story — shift the lens",
      zhHant: "指標不對、故事正確——換個鏡頭",
    },
  },
};

export const TERM_SHEET_COPY = {
  heading: { en: "The term sheet", zhHant: "投資意向書" } satisfies Bi,
  line1: {
    en: "I'd write this check the moment:",
    zhHant: "只要以下條件達成，我就會開出這張支票：",
  } satisfies Bi,
  illustrative: { en: "ILLUSTRATIVE", zhHant: "僅供演示" } satisfies Bi,
  disclaimer: {
    en: "Illustrative only — this is a game, not an investment offer, valuation, or financial advice.",
    zhHant:
      "僅供演示——這是一個遊戲，並非投資要約、估值或財務建議。",
  } satisfies Bi,
  signature: {
    en: "— E. Vásquez",
    zhHant: "— E. Vásquez",
  } satisfies Bi,
};

export const HANDOFF_COPY = {
  heading: {
    en: "The meeting's over.",
    zhHant: "會議結束。",
  } satisfies Bi,
  body: {
    en: "This is the exact thing **{specialist}** fixes for founders at this stage — before a **check** gets written.",
    zhHant:
      "這正是**{specialist}**在這個階段為創辦人解決的問題——在**支票**開出之前。",
  } satisfies Bi,
  formTitle: {
    en: "Leave your details — the team will send you the full readout.",
    zhHant: "留下你的資料——團隊會把完整評估報告發給你。",
  } satisfies Bi,
  successTitle: {
    en: "You've got your readout.",
    zhHant: "你已取得評估報告。",
  } satisfies Bi,
  successBody: {
    en: "Elena's **verdict**, the condition attached to the cheque, and the **automation gap** — it's all in your readout. A human will follow up.",
    zhHant:
      "Elena的**判決**、支票的附加條件、以及**自動化缺口**——全部都在你的報告裏。會有真人跟進。",
  } satisfies Bi,
  privacyNote: {
    en: "Your details go to the Profit Pulse Ally team for a human follow-up. No spam, no sharing.",
    zhHant: "你的資料會交給 Profit Pulse Ally 團隊作真人跟進。不會發垃圾訊息，不會轉交第三方。",
  } satisfies Bi,
  reference: {
    en: "Reference {id} · saved",
    zhHant: "編號 {id} · 已儲存",
  } satisfies Bi,
};

export const GAME_UI = {
  live: { en: "Live", zhHant: "直播中" } satisfies Bi,
  stepStory: { en: "Story", zhHant: "故事" } satisfies Bi,
  stepRound: { en: "Round", zhHant: "輪次" } satisfies Bi,
  stepQuestion: { en: "Question", zhHant: "問題" } satisfies Bi,
  stepNumbers: { en: "Numbers", zhHant: "數字" } satisfies Bi,
  stepReaction: { en: "Reaction", zhHant: "反應" } satisfies Bi,
  stepDefense: { en: "Defense", zhHant: "辯護" } satisfies Bi,
  stepTermSheet: { en: "Term Sheet", zhHant: "意向書" } satisfies Bi,
  storyTitle: {
    en: "What's the story you'd lead with?",
    zhHant: "你會用哪個故事開場？",
  } satisfies Bi,
  storySub: {
    en: "One tap. No wrong answers — the investor will push on whatever you pick.",
    zhHant: "只需點一下。沒有錯誤答案——無論你選甚麼，投資者都會追問。",
  } satisfies Bi,
  metricTitle: {
    en: "Where do you win?",
    zhHant: "你最強的地方是甚麼？",
  } satisfies Bi,
  metricSub: {
    en: "Pick the metric that matters most to your story right now.",
    zhHant: "選擇現在對你的故事最重要的指標。",
  } satisfies Bi,
  roundTitle: {
    en: "What round is this, really?",
    zhHant: "說真的，這是甚麼輪次？",
  } satisfies Bi,
  roundSub: {
    en: "It changes how the investor talks to you — not which question she asks.",
    zhHant: "這會改變投資者跟你說話的方式——但不會改變她問的問題。",
  } satisfies Bi,
  openStep: { en: "The open", zhHant: "開場白" } satisfies Bi,
  bringNumbers: {
    en: "Bring the numbers",
    zhHant: "交出數字",
  } satisfies Bi,
  dataTitle: { en: "The data room", zhHant: "數據資料室" } satisfies Bi,
  dataSub: {
    en: "**Ballpark is fine** — no one audits a cold pitch. She asked specifically about {metric}.",
    zhHant: "**大概數字就可以**——沒人會審計一場陌生提案。她特別問到{metric}。",
  } satisfies Bi,
  showNumbers: {
    en: "Show her the numbers",
    zhHant: "把數字交給她",
  } satisfies Bi,
  reading: {
    en: "Reading your numbers…",
    zhHant: "正在讀取你的數字……",
  } satisfies Bi,
  doingMath: {
    en: "She's doing the math…",
    zhHant: "她正在心算……",
  } satisfies Bi,
  aiRead: {
    en: "AI read · grounded in your numbers",
    zhHant: "AI 解讀 · 基於你輸入的數字",
  } satisfies Bi,
  playIt: {
    en: "How do you play it?",
    zhHant: "你怎麼回應？",
  } satisfies Bi,
  defenseTitle: {
    en: "Pick your move",
    zhHant: "選擇你的應對",
  } satisfies Bi,
  defenseSub: {
    en: "Tap the line you'd actually say. She answers either way.",
    zhHant: "點選你真的會說的話。無論如何她都會回應。",
  } satisfies Bi,
  seeTermSheet: {
    en: "See the term sheet",
    zhHant: "查看投資意向書",
  } satisfies Bi,
  verdictStep: { en: "The verdict", zhHant: "判決" } satisfies Bi,
  worthConversation: {
    en: "This is worth a conversation",
    zhHant: "這值得一場對話",
  } satisfies Bi,
  handoffStep: { en: "The handoff", zhHant: "交接" } satisfies Bi,
  getReadout: { en: "Get my readout", zhHant: "取得我的評估報告" } satisfies Bi,
  sending: { en: "Sending…", zhHant: "發送中……" } satisfies Bi,
  playAgain: { en: "Play again", zhHant: "再玩一次" } satisfies Bi,
  yourReadout: { en: "YOUR READOUT", zhHant: "你的評估報告" } satisfies Bi,
  readoutPitch: { en: "Your pitch", zhHant: "你的提案" } satisfies Bi,
  readoutVerdict: { en: "Her verdict", zhHant: "她的判決" } satisfies Bi,
  readoutCondition: { en: "The condition", zhHant: "附加條件" } satisfies Bi,
  readoutGap: { en: "The automation gap", zhHant: "自動化缺口" } satisfies Bi,
  name: { en: "Name", zhHant: "姓名" } satisfies Bi,
  workEmail: { en: "Work email", zhHant: "公司電郵" } satisfies Bi,
  phone: { en: "Phone", zhHant: "電話" } satisfies Bi,
  company: { en: "Company", zhHant: "公司" } satisfies Bi,
  concern: {
    en: "What's actually keeping you up at night?",
    zhHant: "真正讓你失眠的是甚麼？",
  } satisfies Bi,
  concernSub: {
    en: "(optional)",
    zhHant: "（可選）",
  } satisfies Bi,
  concernPlaceholder: {
    en: "The honest version — it goes to a human, not a model.",
    zhHant: "說真話的版本——它會交給真人，不是模型。",
  } satisfies Bi,
  errRequired: {
    en: "Name, work email, phone and company are required.",
    zhHant: "姓名、公司電郵、電話和公司名稱均為必填。",
  } satisfies Bi,
  requiredMark: { en: "*", zhHant: "*" } satisfies Bi,
  enterNumber: { en: "Enter a number", zhHant: "請輸入數字" } satisfies Bi,
};
export const MODULES: PitchModule[] = [
  // ─── GROWTH ENGINE ────────────────────────────────────────────────
  {
    id: "growth-engine_leads",
    archetype: "growth-engine",
    metric: "leads",
    opening: {
      en: "Growth story — my favourite kind of check. But pipeline volume is a vanity metric until I know what converts.",
      zhHant:
        "增長故事——我最喜歡開的支票類型。但在知道轉化能力之前，潛在客戶量只是一個虛榮指標。",
    },
    question: {
      en: "You said leads are climbing. Is your close rate climbing with them — or is it diluting?",
      zhHant: "你說潛在客戶正在增加。成交率是跟着一起升，還是正在被攤薄？",
    },
    fields: [
      { key: "leadsPerMonth", label: { en: "Monthly qualified leads", zhHant: "每月合資格潛在客戶" }, placeholder: { en: "e.g. 40", zhHant: "例如 40" }, kind: "raw" },
      { key: "closeRatePct", label: { en: "Close rate (%)", zhHant: "成交率（%）" }, placeholder: { en: "e.g. 18", zhHant: "例如 18" }, kind: "pct" },
      { key: "avgDealUsd", label: { en: "Average deal size ($)", zhHant: "平均交易額（美元）" }, placeholder: { en: "e.g. 12000", zhHant: "例如 12000" }, kind: "usd" },
    ],
    rule: { kind: "threshold", field: "closeRatePct", green: 30, amber: 15 },
    downgrade: { field: "leadsPerMonth", below: 20 },
    postures: {
      defend: {
        founder: {
          en: "The close rate is actually up quarter over quarter — newer reps are dragging the blend down.",
          zhHant: "成交率其實逐季上升——是新入職的銷售把整體數字拉低了。",
        },
        investor: {
          en: "Show me the blend excluding new reps and I'll re-run the math on the spot. Fair?",
          zhHant: "把剔除新銷售後的數字給我看，我當場重算。公平吧？",
        },
      },
      "own-gap": {
        founder: {
          en: "Honest answer: we haven't systematised follow-up. Qualified leads are going cold.",
          zhHant: "老實說：我們沒有系統化跟進。合資格客戶正在冷掉。",
        },
        investor: {
          en: "That's a fixable leak — and frankly the best kind of problem to have. What's it costing you a month?",
          zhHant: "這是一個可以修補的漏洞——坦白說也是最好的一種問題。它每個月讓你損失多少？",
        },
      },
      reframe: {
        founder: {
          en: "We're about to double down on outbound — this pipeline looks very different in three months.",
          zhHant: "我們即將大力加強主動外拓——三個月後，這個管道會完全不一樣。",
        },
        investor: {
          en: "Timelines sell better than potential. Show me the pipeline in three months and I'll take this seriously then.",
          zhHant: "時間表比潛力更有說服力。三個月後把管道拿給我看，那時我會認真對待。",
        },
      },
    },
    conditions: [
      {
        bands: ["red"],
        postures: ["own-gap"],
        text: {
          en: "Lead follow-up systematised and close rate holding above {green:closeRatePct}% for one full quarter.",
          zhHant: "系統化客戶跟進，且成交率連續一季維持在{green:closeRatePct}%以上。",
        },
      },
      {
        bands: ["amber"],
        text: {
          en: "Close rate above {green:closeRatePct}% for one more cycle — everything else about this pitch already works.",
          zhHant: "成交率再維持一個週期在{green:closeRatePct}%以上——這份提案的其他部分已經成立。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "Keep this close rate while you 2x the pipeline. The next conversation is about cheque size, not whether.",
          zhHant: "在你把管道擴大一倍的同時保持這個成交率。下一次對話談的是支票金額，而不是要不要投資。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{leadsPerMonth} leads at {closeRatePct}% close — that converts. The real question is whether you can double the top without breaking the middle.",
        zhHant: "{leadsPerMonth}個潛在客戶、{closeRatePct}%成交率——轉化能力很強。真正的問題是：頂部翻倍的同時，中間環節會不會崩掉。",
      },
      amber: {
        en: "{leadsPerMonth} leads at {closeRatePct}% close — workable, but I'd want {green:closeRatePct}%+ before I underwrite a scale story that needs more sales headcount.",
        zhHant: "{leadsPerMonth}個潛在客戶、{closeRatePct}%成交率——可以運作，但我希望在認可一個需要更多銷售人手的擴張故事之前，看到{green:closeRatePct}%以上。",
      },
      red: {
        en: "{leadsPerMonth} leads at {closeRatePct}% close — the top of the funnel isn't the problem, the middle is. We fix the leak before we fund the flow.",
        zhHant: "{leadsPerMonth}個潛在客戶、{closeRatePct}%成交率——漏斗頂端不是問題，中段才是。我們先修好漏洞，再為流量注資。",
      },
    },
    automationFix: {
      en: "Automated lead follow-up and sales-enablement sequences — so no qualified lead goes cold and the close rate stops leaking.",
      zhHant: "自動化客戶跟進與銷售賦能流程——讓合資格客戶不再冷掉，成交率不再流失。",
    },
  },
  {
    id: "growth-engine_close-rate",
    archetype: "growth-engine",
    metric: "close-rate",
    opening: {
      en: "Everyone quotes pipeline. Few can quote conversion with a straight face.",
      zhHant: "人人都會報管道數字。但很少人能面不改色地報出轉化率。",
    },
    question: {
      en: "Walk me through the close: how many touches, how long, and who's actually doing the closing?",
      zhHant: "跟我說說成交過程：多少次接觸、要多久、實際上是誰在成交？",
    },
    fields: [
      { key: "closeRatePct", label: { en: "Close rate (%)", zhHant: "成交率（%）" }, placeholder: { en: "e.g. 22", zhHant: "例如 22" }, kind: "pct" },
      { key: "salesCycleDays", label: { en: "Sales cycle (days)", zhHant: "銷售週期（天）" }, placeholder: { en: "e.g. 30", zhHant: "例如 30" }, kind: "raw" },
      { key: "repCount", label: { en: "Sales reps", zhHant: "銷售人數" }, placeholder: { en: "e.g. 4", zhHant: "例如 4" }, kind: "raw" },
    ],
    rule: { kind: "threshold", field: "closeRatePct", green: 35, amber: 20 },
    downgrade: { field: "salesCycleDays", above: 45 },
    postures: {
      defend: {
        founder: {
          en: "Inbound closes above 40% — the blended number is diluted by cold outbound we started last quarter.",
          zhHant: "主動進線的成交率超過40%——整體數字是被我們上季開始的冷外拓攤薄的。",
        },
        investor: {
          en: "Segment it. If inbound really closes at 40%, the answer is more inbound — which is a different pitch than the one you led with.",
          zhHant: "把它分開看。如果進線真的能以40%成交，答案就是加強進線——這跟你一開始講的故事是兩回事。",
        },
      },
      "own-gap": {
        founder: {
          en: "We don't track touches per deal. Honestly, we're flying a little blind on the middle of the funnel.",
          zhHant: "我們沒有追蹤每宗交易的接觸次數。老實說，我們對漏斗中段有點盲目。",
        },
        investor: {
          en: "Blind spots are cheaper to fix than bad numbers. Get the tracking in place and come back with the real funnel.",
          zhHant: "盲點比壞數字更容易修補。先把追蹤系統建立起來，帶着真實的漏斗回來。",
        },
      },
      reframe: {
        founder: {
          en: "The cycle is long because deals are six figures and the buyer committee got bigger. It's a quality story, not a speed problem.",
          zhHant: "週期長是因為交易都是六位數，而且買方決策委員會變大了。這是品質的故事，不是速度的問題。",
        },
        investor: {
          en: "Long cycles need a bigger balance sheet behind them. I'll take the quality story — but the cash story has to match.",
          zhHant: "長週期需要更厚的資產負債表支撐。我接受品質故事——但現金的故事也得配合得上。",
        },
      },
    },
    conditions: [
      {
        bands: ["red"],
        text: {
          en: "Close rate above {green:closeRatePct}% for a quarter — with touches per deal tracked. Then we're back at this table.",
          zhHant: "成交率連續一季維持在{green:closeRatePct}%以上——並追蹤每宗交易的接觸次數。然後我們回到這張談判桌。",
        },
      },
      {
        bands: ["amber"],
        text: {
          en: "Segment the funnel and hold close rate above {green:closeRatePct}% on inbound. Then we size the cheque.",
          zhHant: "把漏斗分層，並讓進線成交率維持在{green:closeRatePct}%以上。然後我們再談支票大小。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "This close engine is the asset. Protect it — the moment it dips below {amber:closeRatePct}%, call me before you hire.",
          zhHant: "這套成交引擎就是你的資產。保護好它——一旦成交率跌破{amber:closeRatePct}%，先打給我，再談招聘。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{closeRatePct}% close over a {salesCycleDays}-day cycle — that's a machine. The ask is whether it survives double the volume.",
        zhHant: "{salesCycleDays}天週期、{closeRatePct}%成交率——這是一台機器。問題是它能否承受雙倍流量。",
      },
      amber: {
        en: "{closeRatePct}% in {salesCycleDays} days — decent, but long. I'd want {green:closeRatePct}%+ before funding the sales team you're describing.",
        zhHant: "{salesCycleDays}天、{closeRatePct}%成交率——不錯，但週期太長。為你描述的銷售團隊注資之前，我想看到{green:closeRatePct}%以上。",
      },
      red: {
        en: "At {closeRatePct}% with a {salesCycleDays}-day cycle, the leak isn't the funnel — it's the follow-up. That's fixable with process, not more reps.",
        zhHant: "{closeRatePct}%成交率加上{salesCycleDays}天週期——漏洞不在漏斗，而在跟進。這靠流程就能修，不需要更多人。",
      },
    },
    automationFix: {
      en: "Sales-process automation — pipeline tracking, touch sequences, and rep coaching loops so the close rate stops being a mystery.",
      zhHant: "銷售流程自動化——管道追蹤、接觸序列、銷售教練循環，讓成交率不再是一個謎。",
    },
  },
  {
    id: "growth-engine_deal-size",
    archetype: "growth-engine",
    metric: "deal-size",
    opening: {
      en: "Ticket size tells me more about a business than most decks.",
      zhHant: "客單價告訴我的，比大多數簡報都多。",
    },
    question: {
      en: "Your average deal — is it moving up, and what's actually driving the expansion?",
      zhHant: "你的平均交易額——是在上升嗎？實際推動擴張的是甚麼？",
    },
    fields: [
      { key: "avgDealUsd", label: { en: "Average deal size ($)", zhHant: "平均交易額（美元）" }, placeholder: { en: "e.g. 18000", zhHant: "例如 18000" }, kind: "usd" },
      { key: "dealGrowthPct", label: { en: "Deal size trend (% YoY)", zhHant: "交易額趨勢（按年%）" }, placeholder: { en: "e.g. 25", zhHant: "例如 25" }, kind: "pct" },
      { key: "cycleDays", label: { en: "Sales cycle (days)", zhHant: "銷售週期（天）" }, placeholder: { en: "e.g. 45", zhHant: "例如 45" }, kind: "raw" },
    ],
    rule: { kind: "threshold", field: "avgDealUsd", green: 25000, amber: 10000 },
    downgrade: { field: "cycleDays", above: 60 },
    postures: {
      defend: {
        founder: {
          en: "Expansion revenue is where the growth is — existing accounts are already signing bigger deals.",
          zhHant: "增長來自擴張收入——現有客戶已經在簽更大的單。",
        },
        investor: {
          en: "Then lead with that number. Retention-led expansion is a stronger story than new logo count.",
          zhHant: "那就用這個數字開場。由留存驅動的擴張，比新客戶數量更有說服力。",
        },
      },
      "own-gap": {
        founder: {
          en: "We've been pricing too low to win logos. We're leaving money on the table and I know it.",
          zhHant: "為了拿下客戶，我們定價一直偏低。我們把錢留在桌上，我自己清楚。",
        },
        investor: {
          en: "Pricing courage is usually a systems problem — you don't know what each deal costs you. Fix the unit math first.",
          zhHant: "定價缺乏勇氣，通常是系統問題——你不知道每宗交易的真實成本。先修好單位經濟的算術。",
        },
      },
      reframe: {
        founder: {
          en: "Deal size is up because we moved upmarket. It'll take two quarters to show up in the average.",
          zhHant: "交易額上升是因為我們轉攻高端市場。要兩個季度才會反映在平均數上。",
        },
        investor: {
          en: "Upmarket is a working-capital game. Show me the cash curve for those two quarters and we'll talk.",
          zhHant: "高端市場是一場營運資金遊戲。把那兩個季度的現金曲線給我看，我們再談。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "Packaging and pricing restructured, average deal above {green:avgDealUsd} for one quarter. That's the trigger.",
          zhHant: "重整產品包裝與定價，且平均交易額連續一季維持在{green:avgDealUsd}以上。這就是觸發條件。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "Unit economics fixed so you know what a deal really costs — then average ticket above {green:avgDealUsd}.",
          zhHant: "修好單位經濟，讓你清楚每宗交易的真實成本——然後平均客單價達到{green:avgDealUsd}以上。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "Keep the expansion engine warm — deals above {amber:avgDealUsd} compounding is the whole thesis. Come back when you need fuel.",
          zhHant: "保持擴張引擎運轉——{amber:avgDealUsd}以上的交易不斷複利，這就是整個投資邏輯。需要燃料時再回來。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{avgDealUsd} average ticket, climbing {dealGrowthPct}% a year — that's a compounding asset. The question is how many you can run at once.",
        zhHant: "平均客單{avgDealUsd}，每年增長{dealGrowthPct}%——這是一項會複利的資產。問題是你能同時承接多少宗。",
      },
      amber: {
        en: "{avgDealUsd} average deals on a {cycleDays}-day cycle — it works, but the economics get tight once you hire to keep up.",
        zhHant: "{cycleDays}天週期、平均{avgDealUsd}——可以運作，但一旦你要為追上需求而招聘，經濟模型就會變緊。",
      },
      red: {
        en: "Sub-{green:avgDealUsd} tickets with a {cycleDays}-day cycle means you're selling hours, not outcomes. I'd fix the packaging before the pitch.",
        zhHant: "低於{green:avgDealUsd}的客單加上{cycleDays}天週期，意味着你在賣工時，而不是賣成果。我會建議先修好產品包裝再來提案。",
      },
    },
    automationFix: {
      en: "Deal-packaging automation — pricing calculators, proposal systems, and expansion playbooks so every deal is priced like the best one.",
      zhHant: "交易包裝自動化——定價計算器、報價系統、擴張戰術手冊，讓每宗交易都按最佳案例定價。",
    },
  },

  // ─── STRAINED OPS ─────────────────────────────────────────────────
  {
    id: "strained-ops_delivery",
    archetype: "strained-ops",
    metric: "delivery",
    opening: {
      en: "Growth that breaks delivery isn't growth — it's a refund in slow motion.",
      zhHant: "摧毀交付能力的增長不是增長——那是一場慢動作的退款。",
    },
    question: {
      en: "You're winning more than you can ship. What's the actual on-time rate, and how deep is the backlog?",
      zhHant: "你接的單比交得出的多。實際準時率是多少？積壓有多深？",
    },
    fields: [
      { key: "onTimePct", label: { en: "On-time delivery (%)", zhHant: "準時交付率（%）" }, placeholder: { en: "e.g. 82", zhHant: "例如 82" }, kind: "pct" },
      { key: "backlogWeeks", label: { en: "Backlog (weeks)", zhHant: "積壓（週）" }, placeholder: { en: "e.g. 3", zhHant: "例如 3" }, kind: "raw" },
      { key: "teamSize", label: { en: "Team size", zhHant: "團隊人數" }, placeholder: { en: "e.g. 9", zhHant: "例如 9" }, kind: "raw" },
    ],
    rule: { kind: "threshold", field: "onTimePct", green: 90, amber: 75 },
    downgrade: { field: "backlogWeeks", above: 4 },
    postures: {
      defend: {
        founder: {
          en: "The on-time number is dragged by one legacy product line — the new line ships at 95%+.",
          zhHant: "準時率被一條舊產品線拖累——新產品線的準時率超過95%。",
        },
        investor: {
          en: "Segregate it. If the legacy line is the drag, tell me the plan and the cost to fix or kill it.",
          zhHant: "把它分開看。如果舊線是拖累，告訴我修復或砍掉它的計劃和成本。",
        },
      },
      "own-gap": {
        founder: {
          en: "We're throwing humans at the backlog — hiring our way out instead of fixing the process.",
          zhHant: "我們正在用人海戰術應付積壓——用招聘解決問題，而不是修好流程。",
        },
        investor: {
          en: "That's the most expensive fix on the menu. Every manual step you automate pays for itself twice.",
          zhHant: "那是選單上最貴的解法。你每自動化一個手動環節，都等於賺回兩倍。",
        },
      },
      reframe: {
        founder: {
          en: "The backlog is a demand signal — clients wait because we're the best option in the market.",
          zhHant: "積壓是需求訊號——客戶願意等，因為我們是市場上最好的選擇。",
        },
        investor: {
          en: "A backlog is only a signal if you ship into it. Show me the throughput trend, not the waiting list.",
          zhHant: "積壓只有在你能持續交付時才是訊號。給我看吞吐量趨勢，而不是等候名單。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "On-time above {green:onTimePct}% for two straight months with the backlog under control — then we fund the capacity.",
          zhHant: "準時率連續兩個月維持在{green:onTimePct}%以上，且積壓受控——然後我們為產能注資。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "Process first, headcount second. On-time above {green:onTimePct}% and I'll fund the team to match it.",
          zhHant: "流程優先，人手其次。準時率達到{green:onTimePct}%以上，我就會資助與之匹配的團隊。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "This delivery record is the moat. The cheque funds the ops layer that keeps it intact at 3x volume.",
          zhHant: "這份交付紀錄就是護城河。這張支票資助的是能在三倍業務量下守住紀錄的營運層。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{onTimePct}% on time with a {backlogWeeks}-week backlog — a tight ship. The risk is what happens when demand doubles.",
        zhHant: "準時率{onTimePct}%、積壓{backlogWeeks}週——營運嚴謹。風險在於：需求翻倍時會發生甚麼。",
      },
      amber: {
        en: "{onTimePct}% on time and {backlogWeeks} weeks deep — the cracks are showing. I'd shore up ops before I put more fuel in.",
        zhHant: "準時率{onTimePct}%、積壓{backlogWeeks}週——裂縫已經出現。我會先加固營運，再注入更多燃料。",
      },
      red: {
        en: "{onTimePct}% on time is a churn machine waiting to happen — every late delivery is a refund or a lost renewal. Fix ops first.",
        zhHant: "{onTimePct}%的準時率是一台蓄勢待發的流失機器——每次延遲交付都是一次退款或續約流失。先修好營運。",
      },
    },
    automationFix: {
      en: "Delivery-ops automation — scheduling, status tracking, and client-communication loops so on-time rate stops depending on heroics.",
      zhHant: "交付營運自動化——排程、狀態追蹤、客戶溝通循環，讓準時率不再依賴英雄式的加班。",
    },
  },
  {
    id: "strained-ops_support",
    archetype: "strained-ops",
    metric: "support",
    opening: {
      en: "I've watched more deals die of support drowning than of product — the numbers tell the story first.",
      zhHant: "我見過更多交易死於支援淹沒，而不是死於產品——數字最先說出真相。",
    },
    question: {
      en: "How many tickets a month, how fast do you actually respond, and what's the CSAT doing?",
      zhHant: "每月多少張工單？實際回覆有多快？客戶滿意度在往哪個方向走？",
    },
    fields: [
      { key: "ticketsPerMonth", label: { en: "Support tickets / month", zhHant: "每月支援工單" }, placeholder: { en: "e.g. 400", zhHant: "例如 400" }, kind: "raw" },
      { key: "responseHours", label: { en: "First response (hours)", zhHant: "首次回覆（小時）" }, placeholder: { en: "e.g. 8", zhHant: "例如 8" }, kind: "raw" },
      { key: "csatPct", label: { en: "CSAT (%)", zhHant: "客戶滿意度（%）" }, placeholder: { en: "e.g. 88", zhHant: "例如 88" }, kind: "pct" },
    ],
    rule: { kind: "threshold", field: "responseHours", green: 4, amber: 12, invert: true },
    downgrade: { field: "ticketsPerMonth", above: 500 },
    postures: {
      defend: {
        founder: {
          en: "CSAT is actually climbing — we just onboarded a second support hire and the backlog is clearing.",
          zhHant: "客戶滿意度其實在上升——我們剛聘請了第二名支援人員，積壓正在清減。",
        },
        investor: {
          en: "Hires buy time; they don't build leverage. What's the repeat-question rate — how much of this is the same ten answers?",
          zhHant: "招聘買到的是時間，不是槓桿。重複問題的比例是多少——有多少工單其實是同樣十個答案？",
        },
      },
      "own-gap": {
        founder: {
          en: "Honestly, we're reactive — tickets sit until the afternoon because there's no triage.",
          zhHant: "老實說，我們是被動應付——因為沒有分流，工單常常放到下午才處理。",
        },
        investor: {
          en: "That's the cheapest fix in your whole company. Automate the triage and the first response, and watch CSAT move.",
          zhHant: "那是你公司裏成本最低的修補。把分流和首次回覆自動化，你會看到滿意度立刻起變化。",
        },
      },
      reframe: {
        founder: {
          en: "Most tickets are simple questions from new users — the real signal is that onboarding is working.",
          zhHant: "大部分工單來自新用戶的簡單問題——真正的訊號是：上手指引正在奏效。",
        },
        investor: {
          en: "Then the fix is self-serve, not more agents. Ship the knowledge base and measure the deflection rate.",
          zhHant: "那解法就是自助服務，而不是增加客服。上線知識庫，然後量度分流率。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "First response under {green:responseHours} hours with self-serve deflection live — that's the condition. Then I'll fund the scale.",
          zhHant: "首次回覆在{green:responseHours}小時內，並上線自助分流——這就是條件。然後我會資助擴張。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "Triage and deflection automated, first response under {green:responseHours} hours for a month — then we talk cheque size.",
          zhHant: "自動化分流與自助服務，且首次回覆連續一個月維持在{green:responseHours}小時內——然後我們談支票大小。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "The support engine works. The cheque buys the automation that keeps it working at 5x ticket volume.",
          zhHant: "支援引擎運作正常。這張支票購買的是讓它在五倍工單量下依然運作的自動化。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{ticketsPerMonth} tickets with a {responseHours}-hour first response and CSAT at {csatPct}% — that's a support org, not a support pile.",
        zhHant: "每月{ticketsPerMonth}張工單、{responseHours}小時內首次回覆、滿意度{csatPct}%——這是一個支援組織，不是一堆工單。",
      },
      amber: {
        en: "{responseHours} hours to first response on {ticketsPerMonth} tickets — you're holding it together, but the team is the ceiling.",
        zhHant: "{ticketsPerMonth}張工單、{responseHours}小時才首次回覆——你暫時撐得住，但團隊就是天花板。",
      },
      red: {
        en: "At {responseHours} hours to respond, your CSAT is living on borrowed time — support is your biggest renewal risk today.",
        zhHant: "回覆要{responseHours}小時——你的滿意度正在透支未來。支援服務是你今天最大的續約風險。",
      },
    },
    automationFix: {
      en: "AI support triage and self-serve deflection — instant first responses and a knowledge base that answers the repeat 60%.",
      zhHant: "AI 支援分流與自助服務——即時首次回覆，加上能解答六成重複問題的知識庫。",
    },
  },
  {
    id: "strained-ops_hiring",
    archetype: "strained-ops",
    metric: "hiring",
    opening: {
      en: "A business that can't hire faster than it grows is selling capacity it doesn't have.",
      zhHant: "一家招聘速度跟不上增長的公司，是在出售自己沒有的產能。",
    },
    question: {
      en: "How many seats are open, how long are they taking to fill, and what's demand doing in the meantime?",
      zhHant: "有多少職位空缺？填補一個職位要多久？這段時間需求在發生甚麼？",
    },
    fields: [
      { key: "openRoles", label: { en: "Open roles", zhHant: "空缺職位" }, placeholder: { en: "e.g. 4", zhHant: "例如 4" }, kind: "raw" },
      { key: "timeToFillWeeks", label: { en: "Time to fill (weeks)", zhHant: "填補時間（週）" }, placeholder: { en: "e.g. 10", zhHant: "例如 10" }, kind: "raw" },
      { key: "revenueGrowthPct", label: { en: "Revenue growth (%)", zhHant: "收入增長（%）" }, placeholder: { en: "e.g. 40", zhHant: "例如 40" }, kind: "pct" },
    ],
    rule: { kind: "threshold", field: "timeToFillWeeks", green: 4, amber: 8, invert: true },
    downgrade: { field: "openRoles", above: 3 },
    postures: {
      defend: {
        founder: {
          en: "We're picky on purpose — the last three hires were senior and they're already shipping.",
          zhHant: "我們是刻意挑剔——最近三位都是資深人才，而且已經在交付成果。",
        },
        investor: {
          en: "Picky is fine until it's a bottleneck. What does a seat staying open a quarter cost you? Have you run that number?",
          zhHant: "挑剔沒問題，直到它變成瓶頸。一個職位空置一季要花你多少錢？你算過這個數字嗎？",
        },
      },
      "own-gap": {
        founder: {
          en: "We don't have a recruiting function — the founders are doing all of it, badly and slowly.",
          zhHant: "我們沒有招聘職能——所有招聘都是創辦人自己做，做得又差又慢。",
        },
        investor: {
          en: "Founder time on hiring is the most expensive line item you don't track. Systematise it and the pace problem halves.",
          zhHant: "創辦人花在招聘上的時間，是你沒在追蹤的最貴開支。把它系統化，速度問題就解決一半。",
        },
      },
      reframe: {
        founder: {
          en: "These roles are strategic, not reactive — we're building ahead of demand for once.",
          zhHant: "這些職位是戰略性的，不是應急的——我們難得一次走在需求前面。",
        },
        investor: {
          en: "Building ahead only pays if the build lands. Show me the hiring plan with owners and dates, not intentions.",
          zhHant: "超前建設只有在落地時才有回報。給我看有負責人和日期的招聘計劃，而不是意圖。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "Time-to-fill under {green:timeToFillWeeks} weeks with a real recruiting process — then the org can absorb the cheque.",
          zhHant: "建立真正的招聘流程，填補時間壓縮到{green:timeToFillWeeks}週以內——然後組織才能承接這張支票。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "Recruiting ops automated and time-to-fill under {green:timeToFillWeeks} weeks for two quarters — that's the trigger.",
          zhHant: "自動化招聘營運，且填補時間連續兩季維持在{green:timeToFillWeeks}週以內——這就是觸發條件。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "You've proven you can hire into growth. The cheque funds the leadership layer that keeps it true at scale.",
          zhHant: "你已證明自己能靠招聘支撐增長。這張支票資助的是讓這件事在規模化後依然成立的管理層。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{openRoles} roles filling in {timeToFillWeeks} weeks while revenue grows {revenueGrowthPct}% — hiring is keeping pace, which is rarer than you'd think.",
        zhHant: "{openRoles}個職位、{timeToFillWeeks}週填補、收入增長{revenueGrowthPct}%——招聘跟得上增長，這比你想像中罕見。",
      },
      amber: {
        en: "{timeToFillWeeks} weeks to fill at {openRoles} open roles — demand is outrunning the org, and that gap is where execution dies.",
        zhHant: "{openRoles}個空缺、{timeToFillWeeks}週才填補一個——需求正跑贏組織，而執行力就是死在這個缺口裏。",
      },
      red: {
        en: "At {timeToFillWeeks} weeks per hire with {openRoles} seats open, revenue growth is about to hit the org ceiling, not the market.",
        zhHant: "每填補一個職位要{timeToFillWeeks}週、還有{openRoles}個空缺——收入增長即將撞上的不是市場，而是組織天花板。",
      },
    },
    automationFix: {
      en: "Recruiting-ops automation — sourcing, screening, and interview scheduling so seats fill in weeks, not quarters.",
      zhHant: "招聘營運自動化——人才搜尋、篩選、面試排程，讓職位在數週內填補，而不是數季。",
    },
  },
  // ─── MARGIN PLAY ──────────────────────────────────────────────────
  {
    id: "margin-play_gross-margin",
    archetype: "margin-play",
    metric: "gross-margin",
    opening: {
      en: "I invest in machines, not stories. Gross margin is the machine.",
      zhHant: "我投資的是機器，不是故事。毛利率就是那台機器。",
    },
    question: {
      en: "What's the gross margin today, which way is it trending, and what breaks it?",
      zhHant: "今天的毛利率是多少？趨勢往哪走？甚麼會打破它？",
    },
    fields: [
      { key: "grossMarginPct", label: { en: "Gross margin (%)", zhHant: "毛利率（%）" }, placeholder: { en: "e.g. 55", zhHant: "例如 55" }, kind: "pct" },
      { key: "marginTrendPct", label: { en: "Margin trend (pp YoY)", zhHant: "毛利率趨勢（按年百份點）" }, placeholder: { en: "e.g. +4", zhHant: "例如 +4" }, kind: "pct" },
      { key: "monthlyRevenueUsd", label: { en: "Monthly revenue ($)", zhHant: "每月收入（美元）" }, placeholder: { en: "e.g. 60000", zhHant: "例如 60000" }, kind: "usd" },
    ],
    rule: { kind: "threshold", field: "grossMarginPct", green: 60, amber: 40 },
    postures: {
      defend: {
        founder: {
          en: "Margin is up 6 points this year — we finally fixed the COGS mess from last year's supply crunch.",
          zhHant: "今年毛利率升了6個百份點——我們終於收拾了去年供應危機造成的成本亂局。",
        },
        investor: {
          en: "That's the right direction. Where does margin cap out at full utilisation?",
          zhHant: "方向正確。在全面產能運作下，毛利率的天花板在哪裏？",
        },
      },
      "own-gap": {
        founder: {
          en: "We priced for growth, not for margin. The product's great; the economics were an afterthought.",
          zhHant: "我們為增長定價，不是為利潤定價。產品很好；經濟模型是事後才想的。",
        },
        investor: {
          en: "Afterthoughts are fixable — usually with pricing and packaging discipline. Run the 'raise prices 15%' math and come back.",
          zhHant: "事後才想的東西可以修——通常靠定價和包裝紀律。回去算一算「加價15%」的帳，然後再來。",
        },
      },
      reframe: {
        founder: {
          en: "Margins are low because we're in land-grab mode — the leverage arrives in year two when acquisition costs fall.",
          zhHant: "毛利率低是因為我們處於圈地模式——第二年獲客成本下降時，槓桿就會出現。",
        },
        investor: {
          en: "Land grabs need a land war chest. Show me the margin curve on a two-year view, with the assumptions.",
          zhHant: "圈地需要戰爭基金。給我一份兩年視角的毛利率曲線，連同所有假設。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "Gross margin above {green:grossMarginPct}% for two quarters — pricing and COGS restructure first, then we fund growth.",
          zhHant: "毛利率連續兩季維持在{green:grossMarginPct}%以上——先重整定價與成本結構，然後我們資助增長。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "Unit economics fixed and margin above {green:grossMarginPct}% — that's the green light.",
          zhHant: "修好單位經濟，毛利率達到{green:grossMarginPct}%以上——那就是綠燈。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "The margin machine works. The cheque buys the growth engine on top of it — without touching the unit economics.",
          zhHant: "利潤機器運作正常。這張支票購買的是疊加其上的增長引擎——而且不碰單位經濟。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{grossMarginPct}% gross margin, trending {marginTrendPct} points — that's a real machine. Now: growth without wrecking it.",
        zhHant: "毛利率{grossMarginPct}%、趨勢向好{marginTrendPct}個百份點——這是一台真正的機器。現在的問題是：在不破壞它的前提下增長。",
      },
      amber: {
        en: "{grossMarginPct}% with revenue at {monthlyRevenueUsd}/mo — it works, but there's no room for pricing pressure or a bad month.",
        zhHant: "毛利率{grossMarginPct}%、每月收入{monthlyRevenueUsd}——可以運作，但沒有空間承受定價壓力或一個差月份。",
      },
      red: {
        en: "At {grossMarginPct}%, every sale is a treadmill — you're renting revenue. I'd fix the unit economics before raising.",
        zhHant: "{grossMarginPct}%的毛利率，每一單都是在跑步機上——你是在租收入。我會建議先修好單位經濟再融資。",
      },
    },
    automationFix: {
      en: "Pricing and cost automation — margin dashboards, pricing calculators, and procurement workflows so every deal prices above the margin floor.",
      zhHant: "定價與成本自動化——利潤儀表板、定價計算器、採購流程，讓每宗交易都定在利潤底線之上。",
    },
  },
  {
    id: "margin-play_cac",
    archetype: "margin-play",
    metric: "cac",
    opening: {
      en: "I don't ask founders if they're profitable. I ask what it costs to buy a dollar of revenue.",
      zhHant: "我不問創辦人是否賺錢。我問的是：買一塊錢收入要花多少錢。",
    },
    question: {
      en: "What does a customer cost you, what are they worth, and how long until the cash comes back?",
      zhHant: "一個客戶花你多少錢？他們值多少？現金要多久才回本？",
    },
    fields: [
      { key: "cacUsd", label: { en: "Customer acquisition cost ($)", zhHant: "客戶獲取成本（美元）" }, placeholder: { en: "e.g. 400", zhHant: "例如 400" }, kind: "usd" },
      { key: "ltvUsd", label: { en: "Customer LTV ($)", zhHant: "客戶終身價值（美元）" }, placeholder: { en: "e.g. 1200", zhHant: "例如 1200" }, kind: "usd" },
      { key: "paybackMonths", label: { en: "Payback (months)", zhHant: "回本期（月）" }, placeholder: { en: "e.g. 9", zhHant: "例如 9" }, kind: "raw" },
    ],
    rule: { kind: "ratio", numerator: "ltvUsd", denominator: "cacUsd", green: 3, amber: 1.5 },
    downgrade: { field: "paybackMonths", above: 18 },
    postures: {
      defend: {
        founder: {
          en: "CAC is inflated by one expensive channel — organic and referral CAC is a third of that.",
          zhHant: "獲客成本被一個昂貴的渠道拉高了——自然流量和轉介的獲客成本只有它的三分之一。",
        },
        investor: {
          en: "Then the question is scalability: how fast can organic actually grow, and what's the ceiling?",
          zhHant: "那問題就是可擴展性：自然流量實際上能長多快？天花板在哪裏？",
        },
      },
      "own-gap": {
        founder: {
          en: "We don't really know LTV yet — churn is new and the cohort data is thin.",
          zhHant: "我們其實還不知道LTV——流失是新現象，群組數據很薄弱。",
        },
        investor: {
          en: "Thin data is fine if you say so. What I need is the tracking in place to know the truth in two quarters.",
          zhHant: "你明說數據薄弱，沒問題。我需要的是把追蹤系統建立起來，兩個季度後看到真相。",
        },
      },
      reframe: {
        founder: {
          en: "Payback is long because we sell annual contracts upfront — the cash comes in a lump, not monthly.",
          zhHant: "回本期長是因為我們賣年度合約、一次過收費——現金是一筆過進帳，不是按月。",
        },
        investor: {
          en: "That's a cash-flow shape, not a problem — as long as the renewal math holds. Show me cohort renewals.",
          zhHant: "那是現金流的形狀，不是問題——只要續約的算術成立。給我看群組續約數據。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "LTV:CAC above {green:ratio}:1 with payback under 18 months — fix the funnel economics first, then we size.",
          zhHant: "LTV:CAC 高於{green:ratio}:1、回本期少於18個月——先修好漏斗經濟，然後我們談規模。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "Cohort tracking live for two quarters and LTV:CAC above {green:ratio}:1 — that's the green light.",
          zhHant: "群組追蹤上線兩個季度，且LTV:CAC高於{green:ratio}:1——那就是綠燈。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "The unit engine is healthy. The cheque scales the channels that hold the ratio — not the ones that break it.",
          zhHant: "單位引擎健康。這張支票擴大的，是能守住比率的渠道——不是破壞比率的那些。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{ltvUsd} LTV against {cacUsd} CAC — {ratio}:1. That's a healthy engine. The question is whether it holds when you spend more.",
        zhHant: "LTV {ltvUsd} 對比 CAC {cacUsd}——{ratio}:1。這是一台健康的引擎。問題是：花更多錢時它還守得住嗎。",
      },
      amber: {
        en: "At {ltvUsd} LTV and {cacUsd} CAC you're at {ratio}:1 — it works, but there's no margin for error in the payback.",
        zhHant: "LTV {ltvUsd}、CAC {cacUsd}——{ratio}:1。可以運作，但回本期沒有任何出錯空間。",
      },
      red: {
        en: "You're spending {cacUsd} to earn {ltvUsd} — that's not acquisition, that's an expense. Fix the funnel before the fundraise.",
        zhHant: "你花{cacUsd}去賺{ltvUsd}——這不是獲客，這是燒錢。融資之前，先修好漏斗。",
      },
    },
    automationFix: {
      en: "Marketing-measurement and funnel automation — channel-level CAC tracking, lead scoring, and nurture flows so acquisition spend stays efficient.",
      zhHant: "營銷衡量與漏斗自動化——渠道級CAC追蹤、潛在客戶評分、培育流程，讓獲客開支維持高效。",
    },
  },
  {
    id: "margin-play_op-leverage",
    archetype: "margin-play",
    metric: "op-leverage",
    opening: {
      en: "The founders I back build companies where the cost curve flattens while revenue climbs.",
      zhHant: "我支持的創辦人，建造的是成本曲線趨平、收入持續攀升的公司。",
    },
    question: {
      en: "Is revenue growing faster than the cost base — and what's actually falling as a percentage of revenue?",
      zhHant: "收入增長是否快過成本基礎？作為收入百份比，甚麼東西實際在下降？",
    },
    fields: [
      { key: "revenueGrowthPct", label: { en: "Revenue growth (%)", zhHant: "收入增長（%）" }, placeholder: { en: "e.g. 50", zhHant: "例如 50" }, kind: "pct" },
      { key: "opexGrowthPct", label: { en: "Opex growth (%)", zhHant: "營運開支增長（%）" }, placeholder: { en: "e.g. 45", zhHant: "例如 45" }, kind: "pct" },
      { key: "ebitdaMarginPct", label: { en: "EBITDA margin (%)", zhHant: "EBITDA利潤率（%）" }, placeholder: { en: "e.g. 12", zhHant: "例如 12" }, kind: "pct" },
    ],
    rule: { kind: "ratio", numerator: "revenueGrowthPct", denominator: "opexGrowthPct", green: 1.2, amber: 0.9 },
    downgrade: { field: "ebitdaMarginPct", below: 5 },
    postures: {
      defend: {
        founder: {
          en: "Opex is up because we invested ahead in the product team — the leverage shows next year.",
          zhHant: "營運開支上升是因為我們提前投資產品團隊——槓桿明年才會顯現。",
        },
        investor: {
          en: "Ahead-investment is a bet, and bets need a date. When does the cost curve actually bend?",
          zhHant: "超前投資是一場賭注，賭注需要日期。成本曲線到底甚麼時候會彎下來？",
        },
      },
      "own-gap": {
        founder: {
          en: "We've been adding headcount where automation would've done the job. I know it.",
          zhHant: "我們一直在本該用自動化的地方加人手。我知道這一點。",
        },
        investor: {
          en: "That's the most common confession I hear — and the most profitable to fix. Every workflow you automate is margin you don't have to earn.",
          zhHant: "這是我最常聽到的坦白——也是修補後回報最高的。你每自動化一個工作流程，都是不用再辛苦賺回來的利潤。",
        },
      },
      reframe: {
        founder: {
          en: "We're deliberately in build mode — the EBITDA margin will look different in 18 months, by design.",
          zhHant: "我們刻意處於建設模式——18個月後的EBITDA利潤率會完全不同，這是設計使然。",
        },
        investor: {
          en: "Design is fine — show me the model where revenue growth outruns opex growth. If the math bends, I'm interested.",
          zhHant: "設計沒問題——給我看一個收入增長跑贏營運開支增長的模型。如果數字能彎過來，我有興趣。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "Revenue growth above {green:ratio}x cost growth for two quarters — cost discipline first, then the cheque.",
          zhHant: "收入增長連續兩季維持在成本增長的{green:ratio}倍以上——先建立成本紀律，然後才是支票。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "Automate the workflow layer and show the cost curve bending — revenue above {green:ratio}x opex growth and we're in.",
          zhHant: "自動化工作流程層，讓成本曲線彎下來——收入達到營運開支增長的{green:ratio}倍以上，我們就進場。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "You've got real leverage. The cheque funds the growth that rides it without adding proportional cost.",
          zhHant: "你有真正的槓桿。這張支票資助的是乘着槓桿增長、卻不成比例增加成本的成長。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "Revenue at {revenueGrowthPct}% against {opexGrowthPct}% cost growth — that's leverage, and it compounds beautifully.",
        zhHant: "收入增長{revenueGrowthPct}%對比成本增長{opexGrowthPct}%——這就是槓桿，而且複利效果漂亮。",
      },
      amber: {
        en: "{revenueGrowthPct}% revenue against {opexGrowthPct}% opex — you're growing, but the cost base is keeping pace. A treadmill, not a flywheel.",
        zhHant: "收入增長{revenueGrowthPct}%對比營運開支{opexGrowthPct}%——你在增長，但成本基礎同步擴大。這是跑步機，不是飛輪。",
      },
      red: {
        en: "Costs are growing faster than revenue — {opexGrowthPct}% vs {revenueGrowthPct}%. Every hire is making the machine heavier, not faster.",
        zhHant: "成本增長快過收入——{opexGrowthPct}%對比{revenueGrowthPct}%。每一次招聘都讓機器變重，而不是變快。",
      },
    },
    automationFix: {
      en: "Back-office automation — the workflow layer where headcount kept growing: ops, finance ops, and reporting. Flatten the cost curve.",
      zhHant: "後台自動化——那個讓員工人數不斷增長的工作流程層：營運、財務營運、報表。壓平成本曲線。",
    },
  },

  // ─── TEAM CEILING ─────────────────────────────────────────────────
  {
    id: "team-ceiling_founder-bottleneck",
    archetype: "team-ceiling",
    metric: "founder-bottleneck",
    opening: {
      en: "I'm not investing in a founder's calendar. I'm investing in a system that outlives any one person.",
      zhHant: "我投資的不是創辦人的行事曆。我投資的是一個能超越任何單一個人的系統。",
    },
    question: {
      en: "How many hours a week are you doing work that isn't founder work — and how many decisions stop at your desk?",
      zhHant: "你每週有多少小時在做不屬於創辦人的工作？有多少決定會停在你的桌上？",
    },
    fields: [
      { key: "founderOpsHours", label: { en: "Founder hours/week on ops", zhHant: "創辦人每週營運工時" }, placeholder: { en: "e.g. 30", zhHant: "例如 30" }, kind: "raw" },
      { key: "founderDecisionsPct", label: { en: "Decisions through founder (%)", zhHant: "須經創辦人的決定（%）" }, placeholder: { en: "e.g. 60", zhHant: "例如 60" }, kind: "pct" },
      { key: "teamSize", label: { en: "Team size", zhHant: "團隊人數" }, placeholder: { en: "e.g. 12", zhHant: "例如 12" }, kind: "raw" },
    ],
    rule: { kind: "threshold", field: "founderOpsHours", green: 20, amber: 35, invert: true },
    downgrade: { field: "founderDecisionsPct", above: 50 },
    postures: {
      defend: {
        founder: {
          en: "That's this quarter's number — we just hired an ops lead who's taking over the workflow.",
          zhHant: "那是本季的數字——我們剛聘請了一位營運主管，正在接手整個工作流程。",
        },
        investor: {
          en: "Good. What's the founder-hours number in six months? I'll hold you to that.",
          zhHant: "很好。六個月後創辦人工時的數字是多少？我會拿這個數字要求你兌現。",
        },
      },
      "own-gap": {
        founder: {
          en: "I am the bottleneck and I know it — everything's faster through me, which is exactly the problem.",
          zhHant: "我就是瓶頸，我自己清楚——所有事經我手都更快，這恰恰就是問題所在。",
        },
        investor: {
          en: "It's the most expensive bottleneck you'll ever have. What's the first thing you're delegating this month?",
          zhHant: "這是你會遇到的最昂貴瓶頸。這個月你第一件要委派出去的事情是甚麼？",
        },
      },
      reframe: {
        founder: {
          en: "Decisions are concentrated because the standards are high — quality control, not control-freakery.",
          zhHant: "決定集中是因為標準高——這是品質控制，不是控制狂。",
        },
        investor: {
          en: "High standards scale when they're encoded — docs, playbooks, automation. Where's the playbook?",
          zhHant: "高標準只有在被編碼時才能規模化——文件、戰術手冊、自動化。你的手冊在哪裏？",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "Founder out of the ops loop — under {green:founderOpsHours} hours a week for a quarter. Then the team is investable.",
          zhHant: "創辦人退出營運日常——每週營運工時連續一季維持在{green:founderOpsHours}小時以下。然後這個團隊才值得投資。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "First real delegation shipped and founder hours under {green:founderOpsHours} for a quarter — that's the trigger.",
          zhHant: "完成第一次真正的委派，且創辦人工時連續一季維持在{green:founderOpsHours}小時以下——這就是觸發條件。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "You've built the system. The cheque buys the layer that keeps you in the founder seat as it scales.",
          zhHant: "你已建立系統。這張支票購買的是讓你在規模化過程中依然坐在創辦人席位上的那一層。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{founderOpsHours} hours on ops with {founderDecisionsPct}% of decisions through you — you're leading, not operating. That's the right shape.",
        zhHant: "每週{founderOpsHours}小時營運、{founderDecisionsPct}%決定經你手——你在領導，不是在執行。這個形狀是對的。",
      },
      amber: {
        en: "{founderOpsHours} hours a week in the weeds and {founderDecisionsPct}% of decisions through you — you are the system, and systems don't scale.",
        zhHant: "每週{founderOpsHours}小時陷在細節裡、{founderDecisionsPct}%決定經你手——你就是系統，而系統無法規模化。",
      },
      red: {
        en: "You're the product, the ops team, and the sales team — {founderOpsHours} hours in operations is a company that runs on one person.",
        zhHant: "你同時是產品、營運團隊和銷售團隊——{founderOpsHours}小時的營運工時，代表這家公司靠一個人運轉。",
      },
    },
    automationFix: {
      en: "Founder-workload automation — the ops workflow eating founder hours: approvals, reporting, and routine decisions encoded into systems.",
      zhHant: "創辦人工作量自動化——把吞噬創辦人工時的營運流程：審批、報表、例行決定，編碼成系統。",
    },
  },
  {
    id: "team-ceiling_missing-function",
    archetype: "team-ceiling",
    metric: "missing-function",
    opening: {
      en: "Every company has one chair that, if it stays empty, caps everything. Which chair is yours?",
      zhHant: "每家公司都有一張椅子，如果一直空着，就會封頂所有事情。你的那張椅子是哪一張？",
    },
    question: {
      en: "What's the function you've needed for months — and what's it costing you while the seat stays empty?",
      zhHant: "哪個職能是你幾個月來一直需要的？在席位空置期間，它正在讓你付出甚麼代價？",
    },
    fields: [
      { key: "criticalRolesOpen", label: { en: "Critical roles open", zhHant: "關鍵職位空缺" }, placeholder: { en: "e.g. 2", zhHant: "例如 2" }, kind: "raw" },
      { key: "monthsUnfilled", label: { en: "Months unfilled", zhHant: "空缺月數" }, placeholder: { en: "e.g. 8", zhHant: "例如 8" }, kind: "raw" },
      { key: "revenueGrowthPct", label: { en: "Revenue growth (%)", zhHant: "收入增長（%）" }, placeholder: { en: "e.g. 35", zhHant: "例如 35" }, kind: "pct" },
    ],
    rule: { kind: "threshold", field: "monthsUnfilled", green: 2, amber: 6, invert: true },
    downgrade: { field: "criticalRolesOpen", above: 2 },
    postures: {
      defend: {
        founder: {
          en: "We've been running lean by design — the role becomes real at the next revenue milestone.",
          zhHant: "我們是刻意精簡營運——這個職位在下一個收入里程碑時才會真正成型。",
        },
        investor: {
          en: "Milestones are fine — what's the trigger number, and what happens if you hit it a quarter late?",
          zhHant: "里程碑沒問題——觸發數字是多少？如果遲了一季才達到，會發生甚麼？",
        },
      },
      "own-gap": {
        founder: {
          en: "We tried to hire for it twice and whiffed. We've been limping without it ever since.",
          zhHant: "我們嘗試招聘兩次都失敗了。從那時起，我們就一直跛着腳運作。",
        },
        investor: {
          en: "Two whiffs means the spec or the process is wrong — not the market. Fix the search, not the luck.",
          zhHant: "兩次失敗意味着職位描述或流程錯了——不是市場的問題。修好招聘方法，而不是碰運氣。",
        },
      },
      reframe: {
        founder: {
          en: "The work is covered by a senior contractor — expensive, but the function exists.",
          zhHant: "這份工作由一位資深承包商頂着——很貴，但職能確實存在。",
        },
        investor: {
          en: "Contractors bridge gaps; they don't build equity. What's the plan to convert that into a seat?",
          zhHant: "承包商填補缺口，但不建立股權價值。把這個職位轉為正式席位的計劃是甚麼？",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "The chair filled — or a defined interim plan with a date. Role filled within two quarters and I'm in.",
          zhHant: "填補這個席位——或制定一個有日期的過渡計劃。兩個季度內填補職位，我就進場。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "Hiring process rebuilt and the role filled within a quarter — that's the green light.",
          zhHant: "重建招聘流程，並在一季內填補職位——那就是綠燈。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "You've run lean and survived — the cheque funds the seat that turns survival into scale.",
          zhHant: "你精簡營運並活了下來——這張支票資助的，是把生存變成規模的那個席位。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{criticalRolesOpen} critical role open for {monthsUnfilled} months while revenue grows {revenueGrowthPct}% — you've absorbed it, but the ceiling is low.",
        zhHant: "{criticalRolesOpen}個關鍵職位空置{monthsUnfilled}個月、收入仍增長{revenueGrowthPct}%——你吸收得了，但天花板很低。",
      },
      amber: {
        en: "{monthsUnfilled} months with the role open — that's {monthsUnfilled} months of growth paid for with founder hours.",
        zhHant: "職位空置{monthsUnfilled}個月——那是用創辦人工時支付的{monthsUnfilled}個月增長。",
      },
      red: {
        en: "A function missing for {monthsUnfilled} months isn't a hiring problem anymore — it's a structural gap the business is bending around.",
        zhHant: "一個職能缺失{monthsUnfilled}個月，已經不是招聘問題——那是企業正在繞着走的結構性缺口。",
      },
    },
    automationFix: {
      en: "Hiring and recruitment automation for the critical role — sourcing, screening, and interview logistics so the chair fills in weeks.",
      zhHant: "關鍵職位的招聘自動化——人才搜尋、篩選、面試安排，讓席位在數週內填補。",
    },
  },
  {
    id: "team-ceiling_turnover",
    archetype: "team-ceiling",
    metric: "turnover",
    opening: {
      en: "I've seen more companies die of attrition than of competition.",
      zhHant: "我見過更多公司死於人才流失，而不是死於競爭。",
    },
    question: {
      en: "What's your turnover in the last 12 months — and how many of those were people you couldn't afford to lose?",
      zhHant: "過去12個月的流失率是多少？其中有多少是你不能失去的人？",
    },
    fields: [
      { key: "turnoverPct", label: { en: "Turnover, last 12 months (%)", zhHant: "過去12個月流失率（%）" }, placeholder: { en: "e.g. 28", zhHant: "例如 28" }, kind: "pct" },
      { key: "keyRolesLost", label: { en: "Key roles lost", zhHant: "流失的關鍵崗位" }, placeholder: { en: "e.g. 2", zhHant: "例如 2" }, kind: "raw" },
      { key: "teamSize", label: { en: "Team size", zhHant: "團隊人數" }, placeholder: { en: "e.g. 15", zhHant: "例如 15" }, kind: "raw" },
    ],
    rule: { kind: "threshold", field: "turnoverPct", green: 10, amber: 25, invert: true },
    downgrade: { field: "keyRolesLost", above: 2 },
    postures: {
      defend: {
        founder: {
          en: "The departures were mostly underperformers we managed out — the core team is the strongest it's ever been.",
          zhHant: "離職的大多是我們主動淘汰的表現不佳者——核心團隊現在是史上最強。",
        },
        investor: {
          en: "Managed-out is different from lost. What's the retention rate of the people you actually need?",
          zhHant: "主動淘汰和流失是兩回事。你真正需要的人的留任率是多少？",
        },
      },
      "own-gap": {
        founder: {
          en: "We lost two people we couldn't replace, and I think the 'why' is us — the workload is brutal.",
          zhHant: "我們失去了兩個無法替代的人，而我認為原因是我們自己——工作量大得嚇人。",
        },
        investor: {
          en: "Brutal workload is a systems problem. Automate the grind and the retention problem usually follows.",
          zhHant: "嚇人的工作量是系統問題。把苦差自動化，留任問題通常會跟着解決。",
        },
      },
      reframe: {
        founder: {
          en: "Turnover is concentrated in one department we're restructuring — a transition, not a trend.",
          zhHant: "流失集中在一個我們正在重組的部門——這是過渡，不是趨勢。",
        },
        investor: {
          en: "Transitions are fine with a date and a plan. Show me the org chart in six months.",
          zhHant: "過渡沒問題，只要有日期和計劃。給我看六個月後的組織架構圖。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "Turnover under {green:turnoverPct}% with the knowledge documented — a retention plan in place, then we talk.",
          zhHant: "流失率降至{green:turnoverPct}%以下、知識被文件化——並落實留任計劃，然後我們再談。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "The workload fix shipped and key-role retention held for two quarters — that's the trigger.",
          zhHant: "推出工作量改革，並連續兩季守住關鍵崗位留任率——這就是觸發條件。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "You hold your people — the rarest asset. The cheque funds growth without breaking what's working.",
          zhHant: "你留得住人——這是最罕見的資產。這張支票資助增長，卻不破壞正在運作的部分。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{turnoverPct}% turnover with {keyRolesLost} key roles lost — clean for this stage. Retention is a hidden strength here.",
        zhHant: "{turnoverPct}%流失率、失去{keyRolesLost}個關鍵崗位——以這個階段來說很乾淨。留任是你隱藏的強項。",
      },
      amber: {
        en: "{turnoverPct}% is survivable, but {keyRolesLost} key people is a knowledge leak — every exit takes process with it.",
        zhHant: "{turnoverPct}%可以承受，但{keyRolesLost}個關鍵人物離開就是一場知識流失——每一次離職都會帶走流程。",
      },
      red: {
        en: "{turnoverPct}% turnover and {keyRolesLost} key roles gone — that's a churn engine. I need to know why before I'd even look at the numbers.",
        zhHant: "{turnoverPct}%流失率、{keyRolesLost}個關鍵崗位消失——這是一台流失引擎。在我看任何數字之前，我得先知道原因。",
      },
    },
    automationFix: {
      en: "Workload and knowledge automation — the grind that burns people out: manual ops, tribal knowledge, and firefighting encoded into systems.",
      zhHant: "工作量與知識自動化——把令人耗盡的苦差：手動營運、口耳相傳的知識、四處救火，編碼成系統。",
    },
  },
  // ─── MARKET TIMING ────────────────────────────────────────────────
  {
    id: "market-timing_window",
    archetype: "market-timing",
    metric: "window",
    opening: {
      en: "Timing is the only edge you can't buy later. Tell me why it's yours.",
      zhHant: "時機是唯一之後用錢也買不回來的優勢。告訴我為甚麼它屬於你。",
    },
    question: {
      en: "How long is the window, who's moving into it, and what's your actual growth right now?",
      zhHant: "窗口還有多長？誰正在湧進來？你目前的實際增長是多少？",
    },
    fields: [
      { key: "windowMonths", label: { en: "Window (months)", zhHant: "窗口（月）" }, placeholder: { en: "e.g. 9", zhHant: "例如 9" }, kind: "raw" },
      { key: "competitors", label: { en: "Competitors in market", zhHant: "市場競爭者數量" }, placeholder: { en: "e.g. 4", zhHant: "例如 4" }, kind: "raw" },
      { key: "revenueGrowthPct", label: { en: "Revenue growth (%)", zhHant: "收入增長（%）" }, placeholder: { en: "e.g. 60", zhHant: "例如 60" }, kind: "pct" },
    ],
    rule: { kind: "threshold", field: "windowMonths", green: 12, amber: 6 },
    downgrade: { field: "competitors", above: 5 },
    postures: {
      defend: {
        founder: {
          en: "We're already the category reference — the window is ours to lose, not to win.",
          zhHant: "我們已是這個品類的參考標準——這個窗口是我們輸掉的，不是贏回來的。",
        },
        investor: {
          en: "Category reference is a lagging title. What's your share of new customers this quarter — that's the leading one.",
          zhHant: "品類參考是一個落後指標。本季新客戶的佔有率是多少——那才是領先指標。",
        },
      },
      "own-gap": {
        founder: {
          en: "We've been too cautious — building polish while competitors ship rough but fast.",
          zhHant: "我們太謹慎了——競爭對手帶着粗糙但快速的產品上線，我們還在打磨。",
        },
        investor: {
          en: "Rough and fast wins windows. Ship the v1, own the moment, polish later — that's what the cheque is for.",
          zhHant: "粗糙但快速，才能贏得窗口。推出v1、佔據當下、之後再打磨——這就是支票的用途。",
        },
      },
      reframe: {
        founder: {
          en: "The window is longer than the market thinks — the shift takes years, not quarters.",
          zhHant: "窗口比市場想像的更長——這個轉變需要數年，不是數季。",
        },
        investor: {
          en: "Longer windows favour the patient — but they also let everyone in. I need to see the moat forming.",
          zhHant: "更長的窗口有利於耐心的人——但也會讓所有人湧進來。我需要看到護城河正在形成。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "A speed plan with a shipped milestone in 90 days — the window won't wait for a perfect product.",
          zhHant: "一份速度計劃，並在90天內交付里程碑——窗口不會等一個完美的產品。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "V1 shipped to market within a quarter — then we fund the land-grab properly.",
          zhHant: "一季內把v1推出市場——然後我們好好資助這場圈地運動。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "You've got the window and the lead — the cheque buys the speed that makes the lead structural.",
          zhHant: "你擁有窗口和領先——這張支票購買的是把領先變成結構性優勢的速度。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{windowMonths} months of window with revenue growing {revenueGrowthPct}% — the timing is real, and you're early enough to own it.",
        zhHant: "{windowMonths}個月的窗口、收入增長{revenueGrowthPct}%——時機是真的，而且你早得足以佔有它。",
      },
      amber: {
        en: "{windowMonths} months is a real window, but {competitors} competitors mean speed is the whole game.",
        zhHant: "{windowMonths}個月是真實的窗口，但{competitors}個競爭對手意味着：速度就是一切。",
      },
      red: {
        en: "With {windowMonths} months left and {competitors} competitors moving in, this is a land-grab with a countdown — and you're not moving fast enough.",
        zhHant: "只剩{windowMonths}個月、{competitors}個競爭對手正在湧入——這是一場有倒數的圈地戰，而你還不夠快。",
      },
    },
    automationFix: {
      en: "Go-to-market velocity automation — the pipeline, outreach, and delivery machinery that turns a head start into a moat.",
      zhHant: "市場進入速度自動化——把領先優勢變成護城河的管道、外拓和交付機器。",
    },
  },
  {
    id: "market-timing_regulatory",
    archetype: "market-timing",
    metric: "regulatory",
    opening: {
      en: "Regulation is the only market force that shows up on a calendar.",
      zhHant: "監管是唯一會出現在行事曆上的市場力量。",
    },
    question: {
      en: "The rule change lands in a few months — what's exposed, and how ready are you?",
      zhHant: "規則變更幾個月後生效——多少業務會受影響？你準備好了多少？",
    },
    fields: [
      { key: "monthsToChange", label: { en: "Months until change", zhHant: "距離變更的月數" }, placeholder: { en: "e.g. 6", zhHant: "例如 6" }, kind: "raw" },
      { key: "exposurePct", label: { en: "Revenue exposed (%)", zhHant: "受影響收入（%）" }, placeholder: { en: "e.g. 35", zhHant: "例如 35" }, kind: "pct" },
      { key: "readinessPct", label: { en: "Compliance readiness (%)", zhHant: "合規準備度（%）" }, placeholder: { en: "e.g. 60", zhHant: "例如 60" }, kind: "pct" },
    ],
    rule: { kind: "threshold", field: "readinessPct", green: 80, amber: 50 },
    downgrade: { field: "exposurePct", above: 40 },
    postures: {
      defend: {
        founder: {
          en: "Compliance is a feature for us — we're the vendor the incumbents will have to buy from.",
          zhHant: "合規對我們來說是功能——我們是既有業者將來不得不購買的供應商。",
        },
        investor: {
          en: "Then the pitch is a land-grab with a deadline. What's your share of the compliant vendors already?",
          zhHant: "那這個提案就是一場有期限的圈地。目前合規供應商的市場，你佔了多少？",
        },
      },
      "own-gap": {
        founder: {
          en: "We've been treating compliance as a cost, not a wedge. That's about to change.",
          zhHant: "我們一直把合規當成成本，而不是突破口。這個想法即將改變。",
        },
        investor: {
          en: "Flip the framing — this is the best timing story in the market. What's the plan to be the obvious compliant choice?",
          zhHant: "反轉這個框架——這是市場上最好的時機故事。成為顯而易見的合規之選，你的計劃是甚麼？",
        },
      },
      reframe: {
        founder: {
          en: "The change is smaller than the headlines suggest — most of our revenue is adjacent, not exposed.",
          zhHant: "變更比頭條新聞暗示的要小——我們大部分收入只是相關，並未直接暴露。",
        },
        investor: {
          en: "Adjacent is fine — show me the exposure math and your read on how the market will actually react.",
          zhHant: "相關也沒問題——給我看暴露程度的算術，以及你對市場實際反應的判斷。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "Compliance readiness above {green:readinessPct}% before the change lands — the cliff needs to become a moat.",
          zhHant: "在變更生效前，把合規準備度提升到{green:readinessPct}%以上——懸崖必須變成護城河。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "The compliance-wedge plan executed with readiness above {green:readinessPct}% — then we fund the land-grab.",
          zhHant: "執行合規突破口計劃，準備度達到{green:readinessPct}%以上——然後我們資助圈地。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "You're the house the regulation builds — the cheque funds the scale-up while the window is open.",
          zhHant: "你是這波監管浪潮造就的贏家——這張支票在窗口打開期間資助你擴張。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "{readinessPct}% ready with {monthsToChange} months to go — you're ahead of the curve, which is exactly where money is made in these moments.",
        zhHant: "準備度{readinessPct}%、還有{monthsToChange}個月——你走在曲線前面，而這正是這種時刻賺錢的位置。",
      },
      amber: {
        en: "{readinessPct}% ready against {exposurePct}% of revenue exposed — you're in the race, but the calendar is not your friend.",
        zhHant: "準備度{readinessPct}%、{exposurePct}%收入暴露在風險中——你在比賽裏，但行事曆不是你的朋友。",
      },
      red: {
        en: "{monthsToChange} months to the change and {readinessPct}% ready — that's a revenue cliff with a date on it.",
        zhHant: "距離變更還有{monthsToChange}個月、準備度只有{readinessPct}%——這是一座有日期的收入懸崖。",
      },
    },
    automationFix: {
      en: "Compliance-operations automation — monitoring, documentation, and audit workflows so readiness scales instead of manual reviews.",
      zhHant: "合規營運自動化——監測、文件、審計流程，讓準備度靠系統擴展，而不是靠人手審查。",
    },
  },
  {
    id: "market-timing_behavior",
    archetype: "market-timing",
    metric: "behavior",
    opening: {
      en: "The best investments ride a change in behaviour that doesn't reverse.",
      zhHant: "最好的投資，乘着的是一場不會逆轉的行為轉變。",
    },
    question: {
      en: "The shift you're riding — how long has it been going, and how much of your revenue is already made of it?",
      zhHant: "你所乘的這波轉變——已經持續多久了？你的收入有多少已經來自它？",
    },
    fields: [
      { key: "newGrowthPct", label: { en: "New-cohort growth (%)", zhHant: "新群組增長（%）" }, placeholder: { en: "e.g. 25", zhHant: "例如 25" }, kind: "pct" },
      { key: "monthsSinceShift", label: { en: "Months since shift", zhHant: "轉變至今月數" }, placeholder: { en: "e.g. 8", zhHant: "例如 8" }, kind: "raw" },
      { key: "revenueFromShiftPct", label: { en: "Revenue from shift (%)", zhHant: "來自轉變的收入（%）" }, placeholder: { en: "e.g. 20", zhHant: "例如 20" }, kind: "pct" },
    ],
    rule: { kind: "threshold", field: "newGrowthPct", green: 30, amber: 10 },
    downgrade: { field: "revenueFromShiftPct", below: 15 },
    postures: {
      defend: {
        founder: {
          en: "The shift is structural — the old way is dying and we're the obvious replacement.",
          zhHant: "這波轉變是結構性的——舊方式正在消亡，而我們是顯而易見的替代者。",
        },
        investor: {
          en: "Obvious replacements win fast. What's your share of the new-behaviour market — and who's second?",
          zhHant: "顯而易見的替代者贏得很快。在新行為市場你佔多少？誰是第二名？",
        },
      },
      "own-gap": {
        founder: {
          en: "We saw the shift early but moved late — competitors got the head start.",
          zhHant: "我們很早就看到轉變，但行動太遲——競爭對手搶了先機。",
        },
        investor: {
          en: "Late is survivable if the wave is long. What's the catch-up plan with real dates?",
          zhHant: "如果浪夠長，遲到也可以生存。帶着真實日期的追趕計劃是甚麼？",
        },
      },
      reframe: {
        founder: {
          en: "We're deliberately not chasing the first wave — we're positioning for the durable second one.",
          zhHant: "我們刻意不追第一波——我們正在為更持久的第二波佈局。",
        },
        investor: {
          en: "Second-wave plays need patience capital. Show me the positioning and the timing thesis.",
          zhHant: "第二波打法需要耐心資本。給我看佈局和時機論述。",
        },
      },
    },
    conditions: [
      {
        bands: ["red", "amber"],
        text: {
          en: "New-cohort growth above {green:newGrowthPct}% for two quarters — prove the wave is real, then I'll fund the ride.",
          zhHant: "新群組增長連續兩季維持在{green:newGrowthPct}%以上——證明這波浪潮是真的，然後我資助你乘浪。",
        },
      },
      {
        bands: ["amber"],
        postures: ["own-gap"],
        text: {
          en: "The catch-up plan shipped and growth above {green:newGrowthPct}% for a quarter — that's the trigger.",
          zhHant: "推出追趕計劃，且增長連續一季維持在{green:newGrowthPct}%以上——這就是觸發條件。",
        },
      },
      {
        bands: ["green"],
        text: {
          en: "You're on the wave with real revenue proof — the cheque buys the capacity to ride it before it crests.",
          zhHant: "你乘在浪上、有真實收入證明——這張支票購買的是在浪峰來臨前乘穩它的能力。",
        },
      },
    ],
    fallbacks: {
      green: {
        en: "New cohorts growing {newGrowthPct}% with {revenueFromShiftPct}% of revenue already from the shift — you're riding a real wave.",
        zhHant: "新群組增長{newGrowthPct}%、{revenueFromShiftPct}%收入已來自轉變——你正乘着一波真實的浪潮。",
      },
      amber: {
        en: "{newGrowthPct}% new-cohort growth after {monthsSinceShift} months — real signal, but the wave is still young.",
        zhHant: "轉變{monthsSinceShift}個月後，新群組增長{newGrowthPct}%——真實訊號，但浪潮仍然年輕。",
      },
      red: {
        en: "{monthsSinceShift} months in and only {revenueFromShiftPct}% of revenue from the shift — either it's not real yet, or you're not positioned for it.",
        zhHant: "{monthsSinceShift}個月過去，只有{revenueFromShiftPct}%收入來自轉變——要麼它還不是真的，要麼你根本沒有為它佈局。",
      },
    },
    automationFix: {
      en: "Demand-capture automation — the marketing, onboarding, and delivery systems that convert a behaviour shift into market share.",
      zhHant: "需求捕捉自動化——把行為轉變轉化為市佔率的營銷、上手與交付系統。",
    },
  },
];

const moduleIndex = new Map<string, PitchModule>(
  MODULES.map((m) => [m.id, m]),
);

export function getModule(id: string): PitchModule | undefined {
  return moduleIndex.get(id);
}

export function moduleFor(
  archetype: ArchetypeKey,
  metric: MetricKey,
): PitchModule {
  const found = MODULES.find(
    (m) => m.archetype === archetype && m.metric === metric,
  );
  if (!found) {
    throw new Error(`No pitch module for ${archetype}/${metric}`);
  }
  return found;
}
