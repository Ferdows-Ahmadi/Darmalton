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
| Flutter/Dart | Not installed; standalone Dart installation also stalled before download |
| Docker/Compose | Not installed |
| WSL 2 | Not installed at audit time |
| Virtualization | Firmware capability reported unavailable by WMI |

No Xcode installation is attempted on Windows. Flutter stable 3.44.7 was
identified from the official release metadata on 2026-07-24, but its 1.77 GB SDK
archive and the Android toolchain were not installed on this constrained run.

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
