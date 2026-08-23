export type FaqSection = {
  id: string;
  headingEn: string;
  headingZh: string;
  items: { qEn: string; qZh: string; aEn: string; aZh: string }[];
};

/**
 * Full FAQ content (EN + 繁) — approved copy for the educational platform.
 * Internal links point to live routes only.
 */
export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "intro",
    headingEn: "Welcome",
    headingZh: "歡迎",
    items: [
      {
        qEn: "Frequently Asked Questions",
        qZh: "常見問題",
        aEn:
          "Welcome to the Profit Pulse Ally FAQ. This page answers common questions about our educational platform, the free Market Pulse game, founder events, the Zero-Cost Life philosophy, and how everything fits together for Hong Kong business owners and investment learners.\n\nImportant: Everything on this site is for educational and informational purposes only. Profit Pulse Ally is not a licensed insurance intermediary or financial advisor. We do not sell, recommend, or offer any specific insurance or investment products. Mentions of established insurers such as AIA are purely general examples. Returns on any financial products are not guaranteed, involve risks (including possible loss of capital), and depend on market conditions and insurer performance. Always consult a licensed professional and read official documents before making any decisions. See our full [Investment Disclaimer](/investment-disclaimer).",
        aZh:
          "歡迎來到 Profit Pulse Ally 常見問題。本頁解答關於我們的教育平台、免費 Market Pulse 遊戲、創辦人活動、Zero-Cost Life 理念，以及這些如何為香港企業主和投資學習者串連起來的常見問題。\n\n重要：本網站所有內容僅供教育及資訊用途。Profit Pulse Ally 並非持牌保險中介人或財務顧問。我們不銷售、推薦或提供任何特定保險或投資產品。對 AIA 等知名保險公司的提及純屬一般例子。任何金融產品的回報均不保證，涉及風險（包括可能損失本金），並取決於市場狀況及保險公司表現。作出任何決定前，請務必諮詢持牌專業人士並閱讀完整的官方文件。請參閱完整的[投資免責聲明](/investment-disclaimer)。",
      },
    ],
  },
  {
    id: "about",
    headingEn: "About Profit Pulse Ally",
    headingZh: "關於 Profit Pulse Ally",
    items: [
      {
        qEn: "What is Profit Pulse Ally?",
        qZh: "什麼是 Profit Pulse Ally？",
        aEn:
          "Profit Pulse Ally (PPA) is Hong Kong's community platform that pairs a free gamified market-insight challenge (Market Pulse) with real-world founder events. We help business owners, founders, and investment learners practise disciplined thinking — offence, defence, and compounding — toward a Zero-Cost Life. Everything is educational, fun, and community-driven.",
        aZh:
          "Profit Pulse Ally（PPA）是香港的社群平台，將免費的遊戲化市場洞察挑戰（Market Pulse）與真實的創辦人活動結合。我們幫助企業主、創辦人和投資學習者練習有紀律的思考方式——進攻、防守、複利——邁向 Zero-Cost Life。一切純屬教育、有趣且由社群驅動。",
      },
      {
        qEn: "Who runs Profit Pulse Ally?",
        qZh: "誰營運 Profit Pulse Ally？",
        aEn:
          "Profit Pulse Ally is an independent educational and community platform operated by a dedicated Hong Kong-based team with experience in entrepreneurship, education, and founder communities. We focus on creating practical tools, gamified challenges, and events that help business owners and learners practise disciplined thinking around market rhythm, cash-flow protection, and long-term compounding. Everything remains educational only.",
        aZh:
          "Profit Pulse Ally 是一個獨立的教育及社群平台，由一支以香港為基地、具創業、教育及創辦人社群經驗的團隊營運。我們專注於建立實用工具、遊戲化挑戰和活動，幫助企業主和學習者圍繞市場節奏、現金流保障和長期複利練習有紀律的思考。一切維持純教育性質。",
      },
      {
        qEn: "Is Profit Pulse Ally a financial or insurance company?",
        qZh: "Profit Pulse Ally 是金融或保險公司嗎？",
        aEn: "No. We are an educational and community platform. We are not licensed to sell insurance or give investment advice.",
        aZh: "不是。我們是一個教育及社群平台。我們沒有牌照銷售保險或提供投資建議。",
      },
    ],
  },
  {
    id: "game",
    headingEn: "Market Pulse Game",
    headingZh: "Market Pulse 遊戲",
    items: [
      {
        qEn: "What is Market Pulse?",
        qZh: "什麼是 Market Pulse？",
        aEn:
          "Market Pulse is our free, recurring educational challenge. Each cycle you read daily market signal cards (Hong Kong-focused), lock in a Bullish or Cautious call before the window closes, then compare your view with PPA Insight after the reveal. It trains market rhythm and judgment — it is not real trading or investment advice.",
        aZh:
          "Market Pulse 是我們免費、定期舉行的教育挑戰。每個週期你閱讀每日市場信號卡（聚焦香港），在窗口關閉前鎖定 Bullish 或 Cautious 的判斷，然後在揭曉後與 PPA Insight 比較。它訓練市場節奏和判斷力——不是真實交易或投資建議。",
      },
      {
        qEn: "How does a cycle work?",
        qZh: "週期如何運作？",
        aEn:
          "Cycles run on a 10-day schedule (Hong Kong time). You play daily cards (some days are rest days). After the cycle ends, scores and PPA Insight are revealed. The current cycle dates appear on the homepage and game page.",
        aZh:
          "週期以 10 天為一輪（香港時間）。你每日玩信號卡（部分日子為休息日）。週期結束後，分數和 PPA Insight 會揭曉。當前週期日期顯示在首頁和遊戲頁面。",
      },
      {
        qEn: "Do I need to pay to play?",
        qZh: "需要付費才能玩嗎？",
        aEn:
          "No. Market Pulse is completely free. You only need a free Profit Pulse Ally member account to submit calls and appear on the leaderboard.",
        aZh:
          "不需要。Market Pulse 完全免費。你只需要一個免費的 Profit Pulse Ally 會員帳戶即可提交判斷並登上排行榜。",
      },
      {
        qEn: "How are scores calculated?",
        qZh: "分數如何計算？",
        aEn:
          "+10 for participating on a signal card, +50 if your call matches PPA Insight, +100 streak bonus every 3 consecutive correct signal matches. Rest days give +10 participation only. Full details are in the [Market Pulse Rules](/market-pulse/rules).",
        aZh:
          "在信號卡參與得 +10，判斷與 PPA Insight 相符得 +50，連續 3 次正確信號配對得 +100 連勝獎勵。休息日僅得 +10 參與分。完整詳情見[Market Pulse 規則](/market-pulse/rules)。",
      },
      {
        qEn: "What can I win?",
        qZh: "可以贏得什麼？",
        aEn:
          "One Ocean Park ticket is awarded to the winner of each cycle (subject to verification and the [Contest Rules](/contest-rules)). Participation does not guarantee a prize.",
        aZh:
          "每個週期的贏家可獲一張海洋公園門票（須經核實並符合[比賽規則](/contest-rules)）。參與並不保證獲獎。",
      },
      {
        qEn: "Is Market Pulse investment advice?",
        qZh: "Market Pulse 是投資建議嗎？",
        aEn:
          "No. It is an educational simulation and entertainment only. Cards, signals, and insights may be simplified or delayed. Never use them for real trading decisions. See the [Investment Disclaimer](/investment-disclaimer).",
        aZh:
          "不是。它純屬教育模擬和娛樂。卡片、信號和洞察可能被簡化或延遲。切勿用於真實交易決定。請參閱[投資免責聲明](/investment-disclaimer)。",
      },
      {
        qEn: "Do I need an account?",
        qZh: "需要帳戶嗎？",
        aEn:
          "Yes, to play, track your score, and compete. Guests can browse the hub and past revealed standings.",
        aZh:
          "需要，以便遊玩、追蹤分數和參與競賽。訪客可以瀏覽樞紐頁面和過往已揭曉的排名。",
      },
    ],
  },
  {
    id: "events",
    headingEn: "Events & Community",
    headingZh: "活動與社群",
    items: [
      {
        qEn: "What kind of events do you host?",
        qZh: "你們舉辦什麼類型的活動？",
        aEn:
          "We run founder lunches & learns, fireside chats, and workshops focused on business defence, cash-flow thinking, and long-term wealth principles. Past events (e.g. 《我兩樣都要》 and Fortify Your Future) attracted 150+ attendees and included free headshots and high-value networking.",
        aZh:
          "我們舉辦創辦人午餐學習會、爐邊對談和工作坊，聚焦商業防守、現金流思維和長期財富原則。過往活動（如《我兩樣都要》和 Fortify Your Future）吸引了 150 多位參加者，並包括免費專業照和高價值交流。",
      },
      {
        qEn: "Are events free?",
        qZh: "活動免費嗎？",
        aEn:
          "Many are free (including lunch at some sessions). Check the individual event page for details and registration.",
        aZh:
          "很多活動免費（部分場次包括午餐）。請查看個別活動頁面了解詳情和報名。",
      },
      {
        qEn: "How do I register for an event?",
        qZh: "如何報名活動？",
        aEn:
          "Visit the [Events page](/events) or the specific event link. Registration is usually via a simple form.",
        aZh:
          "請瀏覽[活動頁面](/events)或特定活動連結。報名通常透過簡單表格完成。",
      },
      {
        qEn: "What is Matching Pulse?",
        qZh: "什麼是 Matching Pulse？",
        aEn:
          "A pilot feature where members can post business needs, offers, or partnership ideas. PPA reviews and may help create warm introductions. It stays educational and community-focused.",
        aZh:
          "一個試點功能，會員可以發佈商業需求、報價或合作點子。PPA 會審閱並可能協助建立有溫度的引薦。它維持教育和社群導向。",
      },
    ],
  },
  {
    id: "zerocost",
    headingEn: "Zero-Cost Life Philosophy",
    headingZh: "Zero-Cost Life 理念",
    items: [
      {
        qEn: "What is a Zero-Cost Life?",
        qZh: "什麼是 Zero-Cost Life？",
        aEn:
          "A simple milestone: when your passive income covers your essential (or desired \"nice-to-have\") expenses. We break it into clear achievement badges such as Breakfast Coffee Freedom, Commute Liberator, Connectivity Freedom, and Mortgage Shield.",
        aZh:
          "一個簡單的里程碑：當你的被動收入覆蓋你的必要（或理想中的「錦上添花」）開支。我們把它拆解為清晰的成就徽章，例如 Breakfast Coffee Freedom、Commute Liberator、Connectivity Freedom 和 Mortgage Shield。",
      },
      {
        qEn: "What are the three pillars?",
        qZh: "三大支柱是什麼？",
        aEn:
          "Clear goals — define the outcome first, then work backwards. Trend rhythm — know when to wait, act, or accelerate. Achievement-driven — measure progress with milestones and let results compound.",
        aZh:
          "清晰的目標——先定義結果，再倒推。趨勢節奏——知道何時等待、行動或加速。成就驅動——用里程碑衡量進度，讓結果複利。",
      },
      {
        qEn: "How does this help business owners with cash flow?",
        qZh: "這如何幫助企業主管理現金流？",
        aEn:
          "The idea is to use disciplined, long-term compounding principles so extras (WeWork, coffee, travel, team perks, etc.) can potentially be covered over time without touching your core operating cash flow. This is an educational framework only — not a guarantee or product recommendation.",
        aZh:
          "概念是利用有紀律的長期複利原則，讓額外開支（WeWork、咖啡、旅行、團隊福利等）隨時間可能被覆蓋，而不動用你的核心營運現金流。這純屬教育框架——不是保證或產品推薦。",
      },
    ],
  },
  {
    id: "compliance",
    headingEn: "Products, AIA & Compliance (Educational Only)",
    headingZh: "產品、AIA 與合規（僅供教育）",
    items: [
      {
        qEn: "Do you sell AIA products or any insurance/investment products?",
        qZh: "你們銷售 AIA 產品或任何保險／投資產品嗎？",
        aEn:
          "No. Profit Pulse Ally does not sell, recommend, or offer any specific products. We are not a licensed insurance intermediary.",
        aZh:
          "不。Profit Pulse Ally 不銷售、推薦或提供任何特定產品。我們不是持牌保險中介人。",
      },
      {
        qEn: "Why do you mention AIA?",
        qZh: "為什麼提及 AIA？",
        aEn:
          "AIA is an example of a well-established Hong Kong insurer that offers long-term participating savings plans and related products. Some business owners consider such products as one possible tool in a broader plan. Any mention is purely informational. Official illustrated returns are typically in the 4–6.5% range over long horizons (with guaranteed portions much lower) and are subject to strict regulatory illustration rules. Returns are never guaranteed.",
        aZh:
          "AIA 是香港一家成熟保險公司的例子，提供長期分紅儲蓄計劃及相關產品。部分企業主會將此類產品視為更廣泛計劃中的一種可能工具。任何提及純屬資訊性。官方演示回報在長遠時間範圍內通常為 4–6.5%（保證部分遠低於此），並受嚴格監管演示規則約束。回報從不保證。",
      },
      {
        qEn: "How can I learn more about products from AIA or similar providers?",
        qZh: "如何了解更多 AIA 或類似供應商的產品？",
        aEn:
          "Visit the official AIA website or speak directly with a licensed insurance intermediary who can assess your personal situation and suitability. We can help connect you with licensed advisors if you email us (this is a referral only — we give no advice). Always read the full official product documents, understand the risks (including possible loss of capital), fees, and non-guaranteed elements.",
        aZh:
          "瀏覽 AIA 官方網站，或直接與可評估你個人情況和合適性的持牌保險中介人交談。如果你電郵我們，我們可以協助轉介持牌顧問（這純屬轉介——我們不提供建議）。請務必閱讀完整的官方產品文件，了解風險（包括可能損失本金）、費用和非保證元素。",
      },
      {
        qEn: "Will the site ever sell products?",
        qZh: "網站將來會銷售產品嗎？",
        aEn:
          "Only if we (or a partner entity) become a properly licensed insurance intermediary and use exclusively AIA-approved materials, full risk disclosures, and a clear suitability process. Until then the site remains purely educational and we refer out.",
        aZh:
          "只有當我們（或合作實體）成為正式的持牌保險中介人，並僅使用 AIA 批准的材料、完整風險披露和清晰的合適性流程時。在此之前，網站維持純教育性質並向外轉介。",
      },
    ],
  },
  {
    id: "legal",
    headingEn: "Account, Privacy & Legal",
    headingZh: "帳戶、私隱與法律",
    items: [
      {
        qEn: "How do I create an account?",
        qZh: "如何建立帳戶？",
        aEn:
          "Click \"Play Market Pulse\" on the homepage or game page and follow the sign-up. One account per person.",
        aZh:
          "點擊首頁或遊戲頁面的「Play Market Pulse」並按照註冊流程操作。每人一個帳戶。",
      },
      {
        qEn: "What data do you collect?",
        qZh: "你們收集什麼數據？",
        aEn:
          "Account details, game play, newsletter sign-ups, event registrations, and (if you use it) calculator leads. We follow Hong Kong's PDPO. Full details are in our [Privacy Policy](/privacy).",
        aZh:
          "帳戶資料、遊戲記錄、電子報訂閱、活動報名，以及（如你使用）計算器線索。我們遵循香港的《個人資料（私隱）條例》。完整詳情見我們的[私隱政策](/privacy)。",
      },
      {
        qEn: "Where can I find the legal pages?",
        qZh: "在哪裡可以找到法律頁面？",
        aEn:
          "[Investment Disclaimer](/investment-disclaimer) · [Terms of Service](/terms) · [Contest Rules](/contest-rules) · [Market Pulse Rules](/market-pulse/rules) · [Privacy Policy](/privacy)",
        aZh:
          "[投資免責聲明](/investment-disclaimer) · [服務條款](/terms) · [比賽規則](/contest-rules) · [Market Pulse 規則](/market-pulse/rules) · [私隱政策](/privacy)",
      },
      {
        qEn: "Do you use cookies?",
        qZh: "你們使用 cookies 嗎？",
        aEn:
          "Yes. A consent banner appears on first visit. You can accept or reject non-essential cookies.",
        aZh:
          "會。首次瀏覽時會出現同意橫幅。你可以接受或拒絕非必要的 cookies。",
      },
    ],
  },
  {
    id: "contact",
    headingEn: "Getting Started & Contact",
    headingZh: "開始使用與聯絡",
    items: [
      {
        qEn: "How do I get started?",
        qZh: "如何開始？",
        aEn:
          "Play the free [Market Pulse game](/market-pulse/play). Subscribe to the newsletter for cycle updates and event invites. Attend a founder event. Explore the [Zero-Cost Life philosophy](/concept). Try the [Cash-Flow Protector Calculator](/cash-flow-protector).",
        aZh:
          "遊玩免費的 [Market Pulse 遊戲](/market-pulse/play)。訂閱電子報以獲取週期更新和活動邀請。參加創辦人活動。探索 [Zero-Cost Life 理念](/concept)。試用[現金流保障計算器](/cash-flow-protector)。",
      },
      {
        qEn: "How do I contact you?",
        qZh: "如何聯絡你們？",
        aEn:
          "Email contact@profitpulseally.com or use the [Contact page](/contact). For licensed-advisor referrals, mention \"AIA / cash-flow protection interest\" (we will only pass your details with consent).",
        aZh:
          "電郵至 contact@profitpulseally.com 或使用[聯絡頁面](/contact)。如需持牌顧問轉介，請提及「AIA／現金流保障興趣」（我們只會在取得你同意後轉交你的資料）。",
      },
      {
        qEn: "Is the site available in Traditional Chinese?",
        qZh: "網站提供繁體中文嗎？",
        aEn: "Yes. Use the language switcher (EN / 繁) at the top of every page.",
        aZh: "會。使用每頁頂部的語言切換器（EN／繁）。",
      },
      {
        qEn: "Still have a question?",
        qZh: "還有問題？",
        aEn:
          "Email us — we usually reply within 1–2 business days.",
        aZh: "電郵我們——我們通常會在 1–2 個工作天內回覆。",
      },
    ],
  },
];
