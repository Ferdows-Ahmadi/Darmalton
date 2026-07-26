# Darmalton Pharmacy Mobile

Flutter client for the Darmalton Milestone 1 customer flow. The application uses
Riverpod for state, Dio for API requests, go_router for navigation, and platform
secure storage for authentication tokens.

## Android development

From the repository root, use the USB helper for a physical device. It configures
`adb reverse`, builds against `127.0.0.1`, installs, and launches:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\android-device.ps1 -Mode usb -Build -Install -Launch
```

Use `-Mode lan` to discover an active private Wi-Fi address. Add that reported
address to `DJANGO_ALLOWED_HOSTS` in the ignored root `.env` before recreating
the backend. `10.0.2.2` remains the Android-emulator host alias.

The API client accepts a host URL, `/api`, or `/api/v1` form and normalizes it to
one trailing-slash-free `/api/v1` base. Debug builds permit local cleartext HTTP;
release builds do not opt into cleartext and must use HTTPS.

## iOS

The iOS runner is committed for source compatibility. Compilation, CocoaPods,
signing, and device testing require macOS with current Xcode.
