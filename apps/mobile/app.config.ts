import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "EstateDesk",
  slug: "estatedesk",
  version: "0.1.0",
  platforms: ["ios", "android"],
  scheme: "estatedesk",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "ke.co.estatedesk.mobile",
    supportsTablet: true,
    config: { usesNonExemptEncryption: false },
  },
  android: { allowBackup: false, package: "ke.co.estatedesk.mobile" },
  plugins: ["expo-dev-client", "expo-secure-store", "expo-notifications", "expo-sharing",
    ["expo-camera", { cameraPermission: "Allow EstateDesk to take report photos and scan visitor QR passes.", microphonePermission: false, recordAudioAndroid: false }],
    ["expo-image-picker", { photosPermission: "Choose evidence photos for EstateDesk reports.", cameraPermission: "Allow EstateDesk to take report photos and scan visitor QR passes.", microphonePermission: false }]],
  extra: process.env.EXPO_PROJECT_ID
    ? { eas: { projectId: process.env.EXPO_PROJECT_ID } }
    : {},
};
export default config;
