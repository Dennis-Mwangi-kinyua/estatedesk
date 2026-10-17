import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { registerPush } from "./api";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

export async function enablePush() {
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error("Notifications need an Expo project and a development or store build. Contact your administrator.");
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("default", { name: "Workspace updates", importance: Notifications.AndroidImportance.DEFAULT });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error("Allow notifications in your device settings to receive workspace updates.");
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await registerPush(token, Platform.OS === "ios" ? "ios" : "android");
}
