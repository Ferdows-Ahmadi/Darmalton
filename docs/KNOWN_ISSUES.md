# Known Issues

- Docker/Compose is not installed. WSL 2 is absent and WMI reports firmware
  virtualization disabled/unavailable, so the PostgreSQL Compose stack was
  statically inspected but could not be started on this workstation. Confirm
  Intel VT-x/AMD-V in UEFI, install WSL 2 and Docker Desktop, then run
  `docker compose config` and `docker compose up --build`.
- Flutter, Java, and Android platform tools are not installed. Flutter source
  is present, but `flutter analyze`, widget/model tests, emulator/device smoke,
  and APK generation remain unverified. There is currently no APK artifact.
- `mobile/android` and `mobile/ios` contain setup notes rather than generated
  runner projects. After installing Flutter stable, run `flutter create
  --platforms=android,ios .` from `mobile`, review the generated platform files,
  and then run the verification commands in the README.
- iOS compilation and signing cannot be validated on Windows; use a current
  macOS/Xcode runner.
- A standalone Dart SDK installation was attempted for parser-only validation,
  but the package download made no progress and was stopped. This does not
  replace Flutter analysis.
- The attached PDF's master ER diagram page renders without diagram content, but
  its detailed table definitions and relationships are readable and were used.
