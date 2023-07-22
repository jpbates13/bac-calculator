import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jakebates.bac',
  appName: 'bac-calculator',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    url: 'http://10.0.0.234:3000',
    cleartext: true
  }
};

export default config;
