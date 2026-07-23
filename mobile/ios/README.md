# iOS platform generation and validation

The shared Flutter/Dart source is iOS-compatible. On macOS with Flutter 3.44.7,
current stable Xcode, CocoaPods, and an Apple development team:

```bash
flutter create --platforms=ios .
flutter pub get
cd ios && pod install && cd ..
flutter test
flutter build ios --debug --no-codesign
```

Open `ios/Runner.xcworkspace`, select the team/bundle identifier, test on an iOS
simulator and a physical device, then complete signing. No iOS build is claimed
from Windows.
