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
  appendUserAgent: "BridgeLab-iOS",
  ios: {
    scheme: "BridgeLab",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    backgroundColor: "#F5F2EB",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#F5F2EB",
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#F5F2EB",
    },
  },
};

export default config;
