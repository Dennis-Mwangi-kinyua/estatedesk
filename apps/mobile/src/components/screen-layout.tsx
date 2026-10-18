import { Text, View } from "react-native";
import { IconTile, type AppIconName } from "./app-icon";
import { styles } from "./ui";

export function StatusBadge({ status }: { status: string }) {
  const value = status.toUpperCase();
  const color = /REJECT|FAIL|CANCEL|REVOK|INACTIVE|OVERDUE|SUSPEND|DISABLED|DENIED|MISSING.REQUIRED|REQUIRED.MISSING/.test(value) ? "#b43b48"
    : /PENDING|SUBMIT|DRAFT|SCHEDULE|INITIAT|OPEN|REVIEW|UNPAID|PARTIAL|UNRECONCILED|ISSUED|WARN|MISSING|QUEUED/.test(value) ? "#96620e" : "#18755b";
  return <View style={{ alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: `${color}12` }}>
    <Text style={{ color, fontSize: 11, lineHeight: 17, fontWeight: "700" }}>{status.replaceAll("_", " ")}</Text>
  </View>;
}

export function ScreenHeading({ title, description, icon }: { title: string; description?: string; icon: AppIconName }) {
  return <View style={{ gap: 12, paddingVertical: 8 }}><IconTile name={icon} size={26} /><Text accessibilityRole="header" style={styles.title}>{title}</Text>{description ? <Text style={styles.subtitle}>{description}</Text> : null}</View>;
}
