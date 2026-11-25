# Kiro-Maal Real Estate — Android & Google Play Store Guide

This project runs as **both** a responsive Next.js web application and a **native Android application** powered by Capacitor, sharing the exact same Next.js API Routes, Prisma ORM, and MySQL database.

## 1. Local Testing (Android Emulator)
1. Start the Next.js server:
   ```bash
   npm run start
   ```
2. Point Capacitor to your local server (`10.0.2.2` maps to your PC's `localhost` from the Android Emulator):
   ```bash
   npm run mobile:dev
   ```
3. Open the Android project in Android Studio:
   ```bash
   npm run mobile:open
   ```
4. Click **Run** in Android Studio to launch on an emulator or USB-connected Android phone.

## 2. Production Configuration
Set your deployed HTTPS domain and sync Capacitor:
```bash
# PowerShell
$env:CAPACITOR_SERVER_URL="https://kiromaal.com"; npm run mobile:sync
```

## 3. Push Notifications (Firebase Cloud Messaging)
1. Create a Firebase project at https://console.firebase.google.com and add an Android app with package name `so.kiromaal.realestate`.
2. Download `google-services.json` and place it at `android/app/google-services.json`.
3. `CapacitorBridge` automatically requests Android 13+ notification permission and registers each logged-in user's FCM token to `POST /api/mobile/push-token` (stored in MySQL table `device_tokens`).

## 4. Deep Linking (Android App Links)
- Custom scheme: `kiromaal://properties/<id>`
- HTTPS App Links: `https://kiromaal.com/properties/<id>`
- Replace the placeholder SHA-256 fingerprint in `public/.well-known/assetlinks.json` with your Google Play App Signing SHA-256 certificate fingerprint from Play Console → Setup → App Signing.

## 5. Building the Google Play Store Release Bundle (`.aab`)
1. Generate an upload keystore:
   ```bash
   keytool -genkey -v -keystore android/kiromaal-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias kiromaal
   ```
2. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in your passwords.
3. Build the Play Store App Bundle:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
4. Upload `android/app/build/outputs/bundle/release/app-release.aab` and the high-res icon `android/playstore-icon-512.png` to Google Play Console.

