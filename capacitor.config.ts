import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.simuvaction.app',
    appName: 'SimuVaction 26',
    webDir: 'out',
    bundledWebRuntime: false,
    server: {
        androidScheme: 'https'
    }
};

export default config;
