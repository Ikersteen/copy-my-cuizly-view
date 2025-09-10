import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.60f3fd4ff08c4873a7f5daf2554dba18',
  appName: 'getcuizly',
  webDir: 'dist',
  server: {
    url: "https://60f3fd4f-f08c-4873-a7f5-daf2554dba18.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;