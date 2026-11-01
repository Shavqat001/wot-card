import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.steelhangar.game",
  appName: "Стальной ангар",
  webDir: "dist",
  android: {
    backgroundColor: "#10120f",
  },
  server: {
    androidScheme: "https",
  },
}

export default config
