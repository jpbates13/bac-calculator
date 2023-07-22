import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jakebates.bac',
  appName: 'bac-calculator',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
