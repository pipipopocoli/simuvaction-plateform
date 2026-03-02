import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.simuvaction.app',
    appName: 'SimuVaction 26',
    webDir: 'public',
    server: {
        androidScheme: 'https',
        url: 'https://simuvaction-plateform-nfl6ts93q-pipipopocolis-projects.vercel.app',
        cleartext: true
    }
};

export default config;
