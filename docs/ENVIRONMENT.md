# Development Environment

## Audited workstation

| Component | Verified result |
|---|---|
| Operating system | Windows x64, build 26200 |
| Memory | approximately 16 GB |
| Git | 2.55.0.windows.3 |
| Visual Studio Code | 1.129.1 x64 |
| Python | Anaconda 3.13.9 installed at `C:\Users\AFerd\anaconda3\python.exe` |
| Project Python | `.venv` created and used for Django/tests |
| Node/npm | Node.js 24.18.0 and npm 11.16.0 installed |
| Flutter/Dart | Flutter 3.44.7 stable / Dart 3.12.2 at `C:\src\flutter` |
| Android toolchain | Android Studio JDK 21.0.10 and SDK under `%LOCALAPPDATA%\Android\Sdk` |
| Docker/Compose | Docker 29.6.2 / Compose 5.3.1 |
| Physical Android | Pixel 10, Android API 37, authorized through ADB |
| WSL 2 | Not installed at audit time |
| Virtualization | Firmware capability reported unavailable by WMI |

No Xcode installation is attempted on Windows. iOS compilation and signing
remain a macOS-only validation step.

## VS Code extensions

Recommended workspace extensions are listed in `.vscode/extensions.json`. Install
them with `code --install-extension <id>` or accept the workspace recommendation.

## Platform fallback

If WSL 2/Docker Desktop is blocked, run `scripts/setup-local.ps1` and
`scripts/dev-local.ps1`. This uses SQLite only for workstation development.
Compose remains the authoritative PostgreSQL configuration.

Because the current PowerShell execution policy blocks unsigned local scripts,
invoke them with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\<script-name>.ps1
```

The verified device path uses `scripts/dev-up.ps1`, which configures
`adb reverse tcp:8000 tcp:8000` for authorized devices and publishes a bounded
development-only LAN discovery response. The same debug APK selects USB first,
then the discovered or remembered private address without rebuilding. Wi-Fi
testing and meeting access use Private-profile TCP 3000, TCP 8000, and UDP 53535
firewall rules; release
builds never use development discovery and require explicit HTTPS configuration.

Google sign-in additionally requires `GOOGLE_CLIENT_ID` at Django/Next runtime
and as a Flutter `--dart-define`. `GOOGLE_CLIENT_SECRET` is server-only. The
repository contains no Google credentials. Live Android authentication also
requires Google Cloud registration for `com.darmalton.pharmacy` plus the debug
or release signing SHA-1. iOS Google URL-scheme/client registration and signing
must be validated on macOS.
