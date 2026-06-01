import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "it.bridgelab.app",
  appName: "BridgeLab",
  // Load from deployed URL (updates without App Store review)
  server: {
    url: "https://bridgelab.it",
    cleartext: false,
  },
  // Append to user-agent so the web app can detect it's running inside Capacitor
  appendUserAgent: "BridgeLab-Native",
  android: {
    backgroundColor: "#F5F2EB",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    scheme: "BridgeLab",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    backgroundColor: "#F5F2EB",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 8000,
      backgroundColor: "#F5F2EB",
      showSpinner: true,
      spinnerColor: "#1B5E3B",
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#F5F2EB",
    },
  },
};

export default config;
