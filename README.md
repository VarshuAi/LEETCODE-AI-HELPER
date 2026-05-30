# 🖤 Chronos: Premium Matte Carbon Focus Launcher (React Native & Expo)

> A premium, minimalist carbon-slate Home Screen Replacement (Launcher) for Android developed by **Varshan** using **React Native**, **Expo**, and a custom **Local Native Kotlin Module**!

Minimize digital clutter and focus on daily styling. Chronos is built for high-performance gestural routine tracking, background atmospheric lofi audio mixing, and minimalist neomorphic dials. Shifting to Expo means you do **not** need the Flutter SDK anymore—all compilation is done natively through Expo and standard Node/NPM.

---

## ✨ Design Philosophy & Aesthetics

* **Carbon Neumorphic Dial**: The central hub features a ticking custom analog clock driven by React Native animated styles, providing a flawless 60fps sweep.
* **Fuzzy App Search Drawer**: Swiping up opens an elegant carbon tray. Typing filters your installed apps instantly in under 3ms, powered by our custom local native module.
* **Swipe Gestural Routines (Swipe Right)**: Accesses your daily checklists and performance metrics, backed by a persistent SQLite database (`expo-sqlite`).
* **Multi-Channel Lofi Mixing Deck (Swipe Left)**: Synthesizes three high-fidelity local focus sound loops (Rain, Deep Synth, Mellow Piano) using `expo-av` with independent volume mixing, plus a focus stopwatch to track study blocks.

---

## 🧭 Technical Architecture & Local Expo Modules

```
[React Native JS UI (App.js)] 
            │
            ▼  (Local Native Module: "ChronosLauncher")
[ChronosLauncherModule.kt (Native Kotlin)]
            │
            ├──► getInstalledApps() -> Returns mapped list of App Name & Package Name
            └──► launchApp(packageName) -> Spawns launch intent via PackageManager
```

### 📂 Directory Structure

```
C:\Users\Varshan\Documents\antigravity\magical-hypatia\
├── package.json              # App dependencies (expo, expo-av, expo-sqlite)
├── app.json                  # Expo configs & Android package properties
├── App.js                    # Main Entry & PageView horizontal gesture router
├── modules/
│   └── chronos-launcher/     # Local Expo Module for Native Android Methods
│       ├── index.js          # Exposes native functions to JS
│       └── android/          # Native Kotlin Module code
│           └── src/main/java/com/varshan/chronoslauncher/
│               └── ChronosLauncherModule.kt  # Native app loader & manager
├── assets/
│   ├── audio/                # Premium focus loops (Downloaded)
│   │   ├── rain_lofi.mp3
│   │   ├── deep_synth.mp3
│   │   └── mellow_piano.mp3
│   └── icon.png & splash.png # Visual assets
└── screens/
    ├── HomeScreen.js         # Neumorphic clock dial & fuzzy app drawer search
    ├── DashboardScreen.js    # Daily habit checklist & weekly focus metrics chart
    └── MixerScreen.js        # Background audio channel decks & stopwatch
```

---

## 🚀 Setup & Compile Guidelines

To load, build, and run **Chronos Launcher** on your Android device:

### Prerequisites
* [Node.js](https://nodejs.org/) installed.
* [Android SDK](https://developer.android.com/studio) configured (default path: `C:\Users\Varshan\AppData\Local\Android\Sdk`).

### Step 1: Install Dependencies
Open your terminal in the repository folder and execute:
```bash
npm install
```

### Step 2: Compile and Build Native Directories
To generate the native Android code bindings and sync the local Expo module, run:
```bash
npx expo prebuild
```

### Step 3: Run on connected Device/Emulator
1. Connect your Android device via USB debugging or start an emulator.
2. Compile and run the development build:
   ```bash
   npx expo run:android
   ```

### Step 4: Register as Default Launcher
1. Open **Settings** on your Android device.
2. Search for **Default Home App**.
3. Select **Chronos** as your default launcher.
4. Press the Home button and enjoy the premium Carbon Slate layout!

---

*Designed and developed with care by **Varshan**. Elevate your focus. 🚀*
