import { stickerFor } from "@/lib/presentation/stickers";

const accents: Array<[RegExp, string]> = [
  [/notice|move-out|handover|inspection/, "📋"],
  [/cleanliness|cleaning/, "🧹"],
  [/walls?/, "🧱"],
  [/doors?|windows?/, "🚪"],
  [/plumbing/, "🚰"],
  [/electrical/, "💡"],
  [/keys? returned/, "🔑"],
  [/notification|unread|alerts?/, "🔔"],
  [/communication|message|feed/, "💬"],
  [/sent|delivery|send/, "📨"],
  [/offline|queued|waiting/, "🕒"],
  [/viewing/, "👀"],
  [/converted/, "🔑"],
  [/closed|completed|reconciled/, "✅"],
  [/failed|error|disputed|default|unpaid|deficit/, "⚠️"],
  [/contacted|inquir|prospect/, "💬"],
  [/expected|amount due|charge|billing/, "🧾"],
  [/paid|record.*created/, "💳"],
  [/contract|signing/, "📝"],
  [/reward|point|tier|streak/, "🏆"],
  [/email|mail/, "✉️"],
  [/phone|mobile/, "📱"],
  [/identity|national id|full name|profile/, "🪪"],
  [/consent|security|permission/, "🛡️"],
  [/date|since|due day|start|end|updated|calendar/, "📅"],
  [/deposit|balance|account|rent|finance/, "💰"],
  [/document|file|attachment/, "📁"],
  [/maintenance|issue|repair/, "🛠️"],
  [/water|meter/, "💧"],
  [/help|support/, "💬"],
  [/setting|control/, "⚙️"],
  [/company|business/, "🏢"],
  [/onboard|request|queue/, "👋"],
  [/organization|propert|portfolio/, "🏢"],
  [/revenue|growth|report|trend/, "📈"],
  [/payment|billing|collection/, "💳"],
  [/subscription|plan/, "🗂️"],
  [/online|health|live/, "🟢"],
  [/admin|security/, "🛡️"],
  [/user|people|tenant/, "👥"],
  [/developer|api/, "🧑‍💻"],
  [/search/, "🔎"],
  [/action|shortcut/, "⚡"],
  [/lease|audit/, "📋"],
  [/unit/, "🏠"],
  [/summary|snapshot/, "📊"],
];

/** Decorative emoji sticker; the neighbouring text provides its meaning. */
export function EmojiSticker({ label, size = "sm", className = "" }: {
  label: string;
  size?: "xs" | "sm" | "lg";
  className?: string;
}) {
  const emoji = accents.find(([pattern]) => pattern.test(label.toLowerCase()))?.[1] ?? "🗂️";
  return (
    <span aria-hidden="true" data-sticker-tone={stickerFor(label).tone}
      className={`visual-sticker visual-sticker--${size} emoji-sticker ${className}`}>
      {emoji}
    </span>
  );
}
