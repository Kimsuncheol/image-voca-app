---
description: How to build an Android APK file
---

This workflow guides you through building an Android APK file using EAS Build.

1. **Install EAS CLI** (if not already installed)

   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**

   ```bash
   eas login
   ```

3. **Run the Build Command**
   We have configured a specific `apk` profile in `eas.json` for you.

   ```bash
   eas build -p android --profile apk
   ```

4. **Download the APK**
   - Once the build finishes, EAS will provide a download link.
   - You can also find the build in your Expo dashboard.

**Note:**

- If this is your first time building, EAS uses the credentials managed in your Expo account. It might ask you to generate a new keystore, which is recommended for new apps.
- The `apk` profile is configured with `"buildType": "apk"`, which generates an installable APK file rather than an App Bundle (AAB).
