# EstateDesk in VS Code and Diemas Michiels' emulator extension

The workspace recommends `DiemasMichiels.emulate`, which is already installed on the inspected Linux machine. It launches an existing Android virtual device or an Apple simulator. It does not install the SDK, create a signed app, provide Apple/Google developer accounts, or distribute an app.

The extension's [official setup instructions](https://github.com/DiemasMichiels/Emulator) confirm that iOS simulators require macOS with Xcode. Linux can run Android emulators. The workspace defaults match the extension's documented SDK locations; adjust `emulator.emulatorPathLinux` or `emulator.emulatorPathMac` if your SDK is installed elsewhere.

## Android development on Linux

The portable Linux x64 setup stores Java, Android tools, Gradle caches and virtual devices in ignored `.private/toolchains/`. It needs no administrator password and does not change system Java or shell profiles. Existing `JAVA_HOME`, `ANDROID_HOME` and `ANDROID_SDK_ROOT` settings take precedence. Downloads come from Eclipse Adoptium and Google and are checked against publisher checksums before installation; completed download chunks are reused after interruption.

Run these VS Code tasks in order:

1. **EstateDesk: Install portable Android tools (Linux x64)** — downloads and installs the JDK and SDK command tools.
2. **EstateDesk: Review Android SDK licences** — review the licence prompts in your terminal.
3. **EstateDesk: Install Android SDK packages** — reads the installed React Native version catalog to select matching compile SDK, build-tools and NDK versions, plus platform-tools and CMake.
4. **EstateDesk: Create Android virtual device** — installs the emulator and Android 36 Google APIs x86_64 image, creates `EstateDesk_API_36`, and configures the Diemas Michiels extension to use the private SDK/AVD. An existing custom extension path is preserved.
5. **EstateDesk: Native toolchain check** — verifies the runtime, compiler, SDK packages, platform-tools, and a configured emulator or authorized connected phone.
6. Start the virtual device through the extension or **EstateDesk: Start Android virtual device**. If hardware acceleration is unavailable, use a connected Android phone with USB debugging authorized instead.
7. Start **EstateDesk: Web and desktop PWA**, then **EstateDesk: Build and run Android**. This generates/installs the native development build and starts Metro as needed. To build the x86_64 emulator APK without running it, use **EstateDesk: Build Android emulator APK** after prebuild.

Equivalent terminal commands from the repository root:

```bash
node scripts/android-setup.mjs
node scripts/android-dev.mjs licenses
node scripts/android-setup.mjs --packages
node scripts/android-setup.mjs --emulator
node scripts/android-dev.mjs doctor
node scripts/android-dev.mjs emulator -avd EstateDesk_API_36
# In another terminal, start the backend:
npm run dev -w @estatedesk/web -- --hostname 0.0.0.0
# Then build/install the native development app:
node scripts/android-dev.mjs run
```

For machine-readable diagnostics use `node scripts/android-dev.mjs doctor --json`. Add `--android-build` to check compilation prerequisites without requiring a phone or virtual device. The checker does not certify licence acceptance, signing or actual build success.

Android-emulator tasks set `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`, the emulator's route to the host backend. A physical phone needs a reachable LAN address or deployed HTTPS backend instead. For USB development, `adb reverse tcp:3000 tcp:3000` and `adb reverse tcp:8081 tcp:8081` can route the phone's localhost to the development machine; set `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000` before building/running. **EstateDesk: List Android devices** uses the same portable tools.

Use a development build: EstateDesk uses native modules for secure storage, camera, image handling, files, sharing and notifications. Launching an empty emulator or restarting Metro does not install those native modules. If the development build is already installed, **EstateDesk: Metro for Android emulator** starts Metro without rebuilding. Configure the intended development database before using CRM.

If you prefer Android Studio, follow the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) and [Android SDK Manager instructions](https://developer.android.com/tools/sdkmanager), create a phone in Device Manager, and set your SDK/JDK environment variables. The default extension paths work with a conventional Android Studio installation.

## iOS

On a Mac, install Xcode and a simulator runtime, open the extension's **Emulator** command, then run **EstateDesk: Build and run iOS (Mac)**. That task uses the local backend at `http://127.0.0.1:3000`. Physical-device and signed distribution builds require the appropriate Apple provisioning. An iOS Hermes export from Linux is a JavaScript artifact, not an iOS simulator or signed binary.

## Desktop and mobile web

The VS Code **EstateDesk desktop / PWA** and **EstateDesk mobile web** launch configurations open Chrome against the local web app. The mobile-web configuration uses a narrow window for responsive inspection; it is not an Android/iOS native emulator.

Desktop distribution currently uses EstateDesk's installable PWA. Use the browser's installation action on the deployed HTTPS site. Windows/macOS/Linux native installers are not produced by this repository. PWA offline handling retains static app resources and recovery screens; it does not make financial, legal, or CRM server mutations available offline.

## Release checks

Run `npm run mobile:typecheck`, `npm run typecheck`, `npm run mobile:bundle`, `npm run build`, and `npm run release:check -- --artifacts-only`. Before publishing, run the full migration/protocol/live-route checks against the authorized target and signed-in workflows on real devices. Store listings, signing credentials, push provisioning and native crash diagnostics remain distribution requirements.

## Development verification on 10 November

Android prebuild generated the native project successfully. Mobile TypeScript and the focused CRM/date/form checks passed. Offline Expo dependency validation found no mismatches in its bundled dependency map; online validation was unavailable. The inspected environment has no `/dev/kvm`, and no native binary or emulator execution has yet been verified here. Tool installation/download results must be checked separately; setup scripts alone are not proof of a successful native build.

The web and mobile artifacts were rechecked: both match the current application source, and all 50 mobile API handlers are present. That check did not contact the database or deployed backend. Store submission, signing and production deployment are outside the current development stage.

Portable installation was attempted from the coding session using both ordinary downloads and bounded resumable transfers. Large transfers timed out; the JDK/SDK installation is not complete. Run the installation task from VS Code to retry on the workstation network. Completed chunks remain in private ignored storage; no unverified archive is extracted. No native binary or virtual-device run is claimed.
