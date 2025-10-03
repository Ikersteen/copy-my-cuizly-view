import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cuizly.app',
  appName: 'getcuizly',
  webDir: 'dist',
  server: {
    url: "https://60f3fd4f-f08c-4873-a7f5-daf2554dba18.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '832080886475-vbn5ffia76lt4a56fvj8kk6a9sk210vo.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
  ios: {
    scheme: 'com.cuizly.app'
  },
  android: {
    scheme: 'com.cuizly.app'
  }
};

export default config;