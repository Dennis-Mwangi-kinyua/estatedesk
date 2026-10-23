import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "EstateDesk",
  slug: "estatedesk",
  version: "0.1.0",
  platforms: ["ios", "android"],
  scheme: "estatedesk",
  orientation: "default",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  ios: {
    bundleIdentifier: "ke.co.estatedesk.mobile",
    supportsTablet: true,
    config: { usesNonExemptEncryption: false },
  },
  android: { allowBackup: false, package: "ke.co.estatedesk.mobile" },
  plugins: ["expo-dev-client", "expo-secure-store", "expo-notifications", "expo-sharing",
    "./plugins/with-release-signing.cjs",
    ["expo-splash-screen", { image: "./assets/splash.png", imageWidth: 200, resizeMode: "contain", backgroundColor: "#0f766e" }],
    ["expo-camera", { cameraPermission: "Allow EstateDesk to take report photos and scan visitor QR passes.", microphonePermission: false, recordAudioAndroid: false }],
    ["expo-image-picker", { photosPermission: "Choose a profile photo or evidence photos for EstateDesk reports.", cameraPermission: "Allow EstateDesk to take report photos and scan visitor QR passes.", microphonePermission: false }]],
  extra: process.env.EXPO_PROJECT_ID
    ? { eas: { projectId: process.env.EXPO_PROJECT_ID } }
    : {},
};
export default config;
