# Development Environment

## Audited workstation

| Component | Verified result |
|---|---|
| Operating system | Windows x64, build 26200 |
| Memory | approximately 16 GB |
| Git | 2.55.0.windows.3 |
| Visual Studio Code | 1.129.1 x64 |
| Python | Anaconda 3.13.9 installed at `C:\Users\AFerd\anaconda3\python.exe` |
| Node/npm | Not on initial PATH; setup status is recorded below |
| Flutter/Dart | Not on initial PATH; setup status is recorded below |
| Docker/Compose | Not on initial PATH |
| WSL 2 | Not installed at audit time |
| Virtualization | Firmware capability reported unavailable by WMI |

This file is updated only after tools are actually installed and version-checked.
No Xcode installation is attempted on Windows.

## VS Code extensions

Recommended workspace extensions are listed in `.vscode/extensions.json`. Install
them with `code --install-extension <id>` or accept the workspace recommendation.

## Platform fallback

If WSL 2/Docker Desktop is blocked, run `scripts/setup-local.ps1` and
`scripts/dev-local.ps1`. This uses SQLite only for workstation development.
Compose remains the authoritative PostgreSQL configuration.

