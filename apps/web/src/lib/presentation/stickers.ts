export type StickerTone = "sky" | "mint" | "peach" | "violet";
export type Sticker = { emoji: string; tone: StickerTone };
const vocabulary: Array<[RegExp, Sticker]> = [
  [/airbnb|bnb|stay|holiday|bedroom/, { emoji: "🛏️", tone: "peach" }],
  [/water|meter|reading/, { emoji: "💧", tone: "sky" }],
  [/issue|maintenance|repair|inspection|task|caretaker/, { emoji: "🛠️", tone: "peach" }],
  [/payment|rent|income|revenue|balance|billing|finance|collection|payout|expense|tax|budget|accounting/, { emoji: "💳", tone: "mint" }],
  [/tenant|resident|welcome/, { emoji: "👋", tone: "mint" }],
  [/staff|team|employee|user|people|member|agent|landlord|profile/, { emoji: "👥", tone: "violet" }],
  [/propert|organisation|organization|portfolio|building|home/, { emoji: "🏡", tone: "sky" }],
  [/unit|occupied|vacan|occupancy/, { emoji: "🔑", tone: "sky" }],
  [/lease|document|invoice|agreement|export/, { emoji: "📄", tone: "sky" }],
  [/notification|notice|broadcast/, { emoji: "🔔", tone: "peach" }],
  [/message|inbox|support|help|contact|faq|whatsapp|sms|email/, { emoji: "💬", tone: "mint" }],
  [/security|permission|admin|password|login|register|invite/, { emoji: "🔐", tone: "violet" }],
  [/setting|integration|api|control|feature/, { emoji: "⚙️", tone: "sky" }],
  [/calendar|today|schedule/, { emoji: "📅", tone: "peach" }],
  [/complete|closed|resolved|success|verified|health/, { emoji: "✅", tone: "mint" }],
  [/report|analytic|insight|statement|distribution/, { emoji: "📊", tone: "violet" }],
  [/guide|docs|learn/, { emoji: "📚", tone: "violet" }],
  [/search/, { emoji: "🔎", tone: "sky" }],
];
export function stickerFor(label: string): Sticker {
  return vocabulary.find(([pattern]) => pattern.test(label.toLowerCase()))?.[1] ?? { emoji: "📋", tone: "sky" };
}
