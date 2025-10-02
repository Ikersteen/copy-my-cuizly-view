import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cuizly.app',
  appName: 'getcuizly',
  webDir: 'dist',
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
};

export default config;