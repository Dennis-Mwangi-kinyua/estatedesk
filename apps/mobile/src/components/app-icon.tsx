import Feather from "@expo/vector-icons/Feather";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Feather>["name"];
// Resolve API display badges locally so both platforms use the same vector artwork.
const icons: Record<string, IconName> = {
  "🏡": "home", "🏠": "home", "🏘️": "home", "🏢": "briefcase", "💳": "credit-card",
  "🧾": "file-text", "💧": "droplet", "📊": "bar-chart-2", "🎁": "gift", "📁": "folder",
  "🛠️": "tool", "🔧": "tool", "📋": "clipboard", "📬": "inbox", "📣": "volume-2",
  "👋": "users", "👤": "user", "👥": "users", "🔐": "lock", "🛡️": "shield",
  "🕘": "clock", "💬": "message-circle", "🔔": "bell", "🔄": "refresh-cw",
  "🗂️": "grid", "✨": "external-link", "🌐": "globe", "⚡": "zap", "💡": "sun",
  "⚙️": "settings", "📝": "edit-3", "💰": "dollar-sign", "📈": "trending-up",
  "→": "arrow-right", "↗": "arrow-up-right",
};
const colors: Partial<Record<IconName, string>> = {
  home: "#16805d", briefcase: "#4f62bf", "credit-card": "#2563c4",
  "file-text": "#b66a12", droplet: "#0284b8", "bar-chart-2": "#7c4ac4",
  gift: "#c13b82", folder: "#b47712", tool: "#c35b28", clipboard: "#087e8b",
  inbox: "#496dc2", "volume-2": "#9b48b1", users: "#0b8590", user: "#7651bc",
  lock: "#b64b69", shield: "#16805d", clock: "#ba651c", "message-circle": "#2477b7",
  bell: "#b77a12", "refresh-cw": "#16805d", grid: "#5963c6", "external-link": "#7952b9",
  globe: "#287db2", zap: "#b77912", sun: "#bf7616", settings: "#566c90",
  "edit-3": "#19827b", "dollar-sign": "#16805d", "trending-up": "#16805d",
};
export function AppIcon({ badge, name, size = 22, color }: {
  badge?: string; name?: IconName; size?: number; color?: string;
}) {
  const resolved = name ?? icons[badge ?? ""] ?? "grid";
  return <Feather name={resolved} size={size} color={color ?? colors[resolved] ?? "#5963c6"} accessible={false} />;
}
