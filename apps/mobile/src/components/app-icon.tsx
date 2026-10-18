import Feather from "@expo/vector-icons/Feather";
import type { ComponentProps } from "react";
import { View } from "react-native";

type IconName = ComponentProps<typeof Feather>["name"];
export type AppIconName = IconName;
// Resolve API display badges locally so both platforms use the same vector artwork.
const icons: Record<string, IconName> = {
  "🏡": "home", "🏠": "home", "🏘️": "home", "🏢": "briefcase", "💳": "credit-card",
  "🧾": "file-text", "💧": "droplet", "📊": "bar-chart-2", "🎁": "gift", "📁": "folder",
  "🛠️": "tool", "🔧": "tool", "📋": "clipboard", "📬": "inbox", "📣": "volume-2",
  "👋": "users", "👤": "user", "👥": "users", "🔐": "lock", "🛡️": "shield",
  "🕘": "clock", "💬": "message-circle", "🔔": "bell", "🔄": "refresh-cw",
  "🗂️": "grid", "✨": "external-link", "🌐": "globe", "⚡": "zap", "💡": "sun",
  "⚙️": "settings", "📝": "edit-3", "💰": "dollar-sign", "📈": "trending-up",
  "💻": "code", "🔌": "cpu", "🚩": "flag", "⏱️": "activity", "🗄️": "database",
  "💾": "hard-drive", "🩺": "activity", "🔑": "key", "🎛️": "sliders", "🔎": "search",
  "✉️": "mail", "📢": "volume-2", "🚀": "send", "🎧": "headphones", "🚧": "shield",
  "🚪": "home", "👔": "users", "📒": "book-open", "🏛️": "briefcase", "📦": "package",
  "🧰": "tool", "🪪": "user-check", "🤝": "users", "📥": "download", "📨": "mail", "💼": "briefcase", "🛎️": "bell",
  "→": "arrow-right", "↗": "arrow-up-right",
};
const colors: Partial<Record<IconName, string>> = {
  code: "#7952b9", cpu: "#2477b7", flag: "#c35b28", activity: "#087e8b", database: "#5963c6",
  "hard-drive": "#566c90", key: "#b47712", sliders: "#7952b9", search: "#2563c4",
  mail: "#2477b7", send: "#16805d", headphones: "#9b48b1", "book-open": "#b66a12", package: "#c35b28",
  "user-check": "#16805d", download: "#2477b7",
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

/** Shared tinted icon tile, with consistent artwork on iOS and Android. */
export function IconTile({ badge, name, size = 24 }: { badge?: string; name?: IconName; size?: number }) {
  const resolved = name ?? icons[badge ?? ""] ?? "grid";
  const color = colors[resolved] ?? "#5963c6";
  return <View accessible={false} style={{ width: size + 26, height: size + 26, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: `${color}12`, borderWidth: 1, borderColor: `${color}20` }}>
    <AppIcon name={resolved} size={size} color={color} />
  </View>;
}
