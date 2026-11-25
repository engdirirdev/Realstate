import type { CapacitorConfig } from "@capacitor/cli";

// Production URL by default; override locally for Android Emulator via:
//   CAPACITOR_SERVER_URL=http://10.0.2.2:3000 npx cap sync android
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://kiromaal.com";

const isLocalHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "so.kiromaal.realestate",
  appName: "Kiro-Maal Real Estate",
  webDir: "capacitor-web",
  backgroundColor: "#0B1728",
  server: {
    url: serverUrl,
    cleartext: isLocalHttp,
    androidScheme: "https",
    allowNavigation: [
      "kiromaal.com",
      "*.kiromaal.com",
      "kiro-maal.so",
      "*.kiro-maal.so",
      "10.0.2.2",
      "localhost",
    ],
  },
  android: {
    backgroundColor: "#0B1728",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isLocalHttp,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 400,
      backgroundColor: "#0B1728",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0B1728",
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;

