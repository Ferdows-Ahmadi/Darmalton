# Next Steps

This file tracks only work that remains after the latest verified build. Current
implementation progress is in `docs/BUILD_LOG.md`.

1. Enable hardware virtualization in UEFI, install WSL 2/Docker Desktop, and run
   the PostgreSQL Compose stack plus the integrated smoke flow.
2. Install Flutter stable and Android Studio/JDK/platform tools; generate the
   Android/iOS runner projects, run `flutter analyze` and `flutter test`, and
   produce a debug APK on an emulator-capable machine.
3. Validate iOS on a macOS CI runner or developer Mac.
4. For Phase 2, prioritize prescription upload/review, pharmacy staff workflow,
   delivery assignment/tracking, customer notifications, audit logging, rate
   limiting, managed secrets/object storage, and CI across PostgreSQL/web/mobile.
