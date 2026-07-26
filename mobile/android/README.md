# Android runner

The generated Flutter Android runner is committed with application ID
`com.darmalton.pharmacy`. Debug builds alone permit cleartext HTTP for local-LAN
development; production builds must use HTTPS.

```powershell
flutter pub get
flutter analyze
flutter test
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

Use `10.0.2.2` for an Android emulator. For a physical phone, prefer the root
`scripts/android-device.ps1 -Mode usb` workflow, which uses `adb reverse` and
`127.0.0.1`. The `-Mode lan` alternative discovers the current private address;
keep both devices on the same private network and limit firewall access to that
profile.
