import { requireNativeModule } from 'expo-modules-core';

// This will require the native module auto-linked under the declared name
const ChronosLauncherModule = requireNativeModule('ChronosLauncherModule');

export default {
  async getInstalledApps() {
    return await ChronosLauncherModule.getInstalledApps();
  },
  async launchApp(packageName) {
    return await ChronosLauncherModule.launchApp(packageName);
  }
};
