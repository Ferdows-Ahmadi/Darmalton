# Android platform generation

After Flutter 3.44.7 and Android Studio/SDK are installed:

```powershell
flutter create --platforms=android .
flutter pub get
flutter analyze
flutter test
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

Flutter will replace this directory with the generated Gradle project. Firmware
virtualization is required for a performant emulator; a physical Android device
can use the Windows machine's LAN API address instead.
