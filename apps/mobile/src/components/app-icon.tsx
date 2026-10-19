import type Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
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
  "check-circle": "#16805d", "alert-circle": "#b77912", "wifi-off": "#566c90", camera: "#0284b8", image: "#7952b9", "trash-2": "#c43f5b",
  "user-check": "#16805d", download: "#2477b7", "log-out": "#c43f5b",
  home: "#16805d", briefcase: "#4f62bf", "credit-card": "#2563c4",
  "file-text": "#b66a12", droplet: "#0284b8", "bar-chart-2": "#7c4ac4",
  gift: "#c13b82", folder: "#b47712", tool: "#c35b28", clipboard: "#087e8b",
  inbox: "#496dc2", "volume-2": "#9b48b1", users: "#0b8590", user: "#7651bc",
  lock: "#b64b69", shield: "#16805d", clock: "#ba651c", "message-circle": "#2477b7",
  bell: "#b77a12", "refresh-cw": "#16805d", grid: "#5963c6", "external-link": "#7952b9",
  globe: "#287db2", zap: "#b77912", sun: "#bf7616", settings: "#566c90",
  "edit-3": "#19827b", "dollar-sign": "#16805d", "trending-up": "#16805d",
};
// Bundled outline icons stay sharp on high-density Android and iOS displays.
const artwork: Partial<Record<IconName, ComponentProps<typeof Ionicons>["name"]>> = {
  home: "home-outline", briefcase: "business-outline", "credit-card": "card-outline",
  "file-text": "document-text-outline", droplet: "water-outline", "bar-chart-2": "bar-chart-outline",
  gift: "gift-outline", folder: "folder-open-outline", tool: "construct-outline", clipboard: "clipboard-outline",
  inbox: "file-tray-outline", "volume-2": "megaphone-outline", users: "people-outline", user: "person-outline",
  lock: "lock-closed-outline", shield: "shield-checkmark-outline", clock: "time-outline", "message-circle": "chatbubble-ellipses-outline",
  bell: "notifications-outline", "refresh-cw": "refresh-outline", grid: "grid-outline", "external-link": "open-outline",
  globe: "globe-outline", zap: "flash-outline", sun: "sunny-outline", settings: "settings-outline",
  "edit-3": "create-outline", "dollar-sign": "cash-outline", "trending-up": "trending-up-outline",
  code: "code-slash-outline", cpu: "hardware-chip-outline", flag: "flag-outline", activity: "pulse-outline",
  database: "server-outline", "hard-drive": "save-outline", key: "key-outline", sliders: "options-outline",
  search: "search-outline", mail: "mail-outline", send: "send-outline", headphones: "headset-outline",
  "book-open": "book-outline", package: "cube-outline", "user-check": "person-circle-outline", download: "download-outline",
  "arrow-right": "arrow-forward-outline", "arrow-left": "arrow-back-outline", "arrow-up-right": "arrow-up-outline",
  "chevron-right": "chevron-forward-outline", "chevron-left": "chevron-back-outline", "chevron-down": "chevron-down-outline",
  "check-circle": "checkmark-circle-outline", check: "checkmark-outline", plus: "add-outline", x: "close-outline",
  "wifi-off": "cloud-offline-outline", wifi: "wifi-outline", camera: "camera-outline", image: "image-outline",
  "log-out": "log-out-outline", "more-horizontal": "ellipsis-horizontal-outline", "alert-circle": "alert-circle-outline",
  "trash-2": "trash-outline", "eye": "eye-outline", "eye-off": "eye-off-outline", upload: "cloud-upload-outline",
};
export function AppIcon({ badge, name, size = 22, color }: {
  badge?: string; name?: IconName; size?: number; color?: string;
}) {
  const resolved = name ?? icons[badge ?? ""] ?? "grid";
  return <Ionicons name={artwork[resolved] ?? "grid-outline"} size={size} color={color ?? colors[resolved] ?? "#5963c6"} accessible={false} />;
}

/** Shared tinted icon tile, with consistent artwork on iOS and Android. */
export function IconTile({ badge, name, size = 24 }: { badge?: string; name?: IconName; size?: number }) {
  const resolved = name ?? icons[badge ?? ""] ?? "grid";
  const color = colors[resolved] ?? "#5963c6";
  return <View accessible={false} style={{ width: size + 26, height: size + 26, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}26` }}>
    <AppIcon name={resolved} size={size} color={color} />
  </View>;
}
