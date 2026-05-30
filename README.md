# 🖤 Chronos: Premium Matte Carbon Focus Launcher

> A premium, minimalist carbon-slate Home Screen Replacement (Launcher) for Android developed by **Varshan** using **Flutter** and native **Kotlin MethodChannels**!

Minimize digital clutter and focus on daily styling. Chronos is built for high-performance gestural routine tracking, background atmospheric lofi audio mixing, and minimalist neomorphic dials.

---

## ✨ Design Philosophy & Aesthetics

* **Carbon Neumorphic Dial**: The central hub features a ticking custom-painted analog clock with deep shadow offsets and an active crimson second hand.
* **Fuzzy App Search Drawer**: Swiping up launches a local, sub-3ms fuzzy-search engine that queries, filters, and launches installed Android packages directly.
* **Swipe Gestural Routines (Swipe Right)**: Accesses your daily checklists and performance metrics, backed by a persistent SQLite database.
* **Multi-Channel Lofi Mixing Deck (Swipe Left)**: Synthesizes three high-fidelity local focus sound loops (Rain, Deep Synth, Mellow Piano) with interactive slider mixing, plus a focus stopwatch to track study/deep-work blocks.

---

## 🧭 Technical Architecture & MethodChannels

```
[Flutter UI Layout (Dart)] 
         │
         ▼  (MethodChannel: "com.varshan.chronos/apps")
[MainActivity.kt (Native Kotlin)]
         │
         ├──► getInstalledApps() -> Returns mapped list of App Name & Package Name
         └──► launchApp(packageName) -> Spawns launch intent via PackageManager
```

### 📂 Directory Structure

```
C:\Users\Varshan\Documents\antigravity\magical-hypatia\
├── pubspec.yaml              # Flutter dependencies & Assets declarations
├── assets/
│   └── audio/                # Local focus MP3 loops (27MB+)
│       ├── rain_lofi.mp3
│       ├── deep_synth.mp3
│       └── mellow_piano.mp3
├── android/app/src/main/
│   ├── AndroidManifest.xml   # HOME category intent-filter setup
│   └── kotlin/com/varshan/chronos_launcher/
│       └── MainActivity.kt   # Native Kotlin MethodChannel (Apps loader)
└── lib/
    ├── main.dart             # Tab-router, Gestural page swipes, and overlay styling
    ├── database/
    │   └── db_helper.dart    # SQLite routine planner & metrics tracker
    └── screens/
        ├── home_screen.dart  # Minimalist dial clock & fuzzy search apps drawers
        ├── dashboard.dart    # Daily checklists & weekly focus bar charts
        └── mixer.dart        # Background audio loops deck & focus stopwatch
```

---

## 🚀 Setup & Compile Guidelines

To load, build, and run **Chronos Launcher** on your Android device:

### Prerequisites
* [Flutter SDK](https://docs.flutter.dev/get-started/install) installed.
* [Android SDK](https://developer.android.com/studio) configured (default path: `C:\Users\Varshan\AppData\Local\Android\Sdk`).

### Step 1: Install Dependencies
Open your terminal in the project directory and run:
```bash
flutter pub get
```

### Step 2: Run and Compile
1. Connect your Android device or start an emulator.
2. Build and run the app in debug mode:
   ```bash
   flutter run
   ```
3. To build a premium production release APK, execute:
   ```bash
   flutter build apk --release
   ```

### Step 3: Register as Default Launcher
1. Open **Settings** on your Android device.
2. Search for **Default Home App**.
3. Select **Chronos** as your default launcher.
4. Press the Home button and enjoy the premium Carbon Slate layout!

---

*Designed and developed with care by **Varshan**. Elevate your focus. 🚀*
