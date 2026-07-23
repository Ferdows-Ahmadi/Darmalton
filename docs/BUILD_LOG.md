# Build Log

## 2026-07-23 - Environment and design audit

- Confirmed 64-bit Windows build 26200 on x64 hardware with about 16 GB RAM.
- Confirmed free space: approximately 397 GB on C: and 917 GB on D:.
- Git 2.55.0 and VS Code 1.129.1 are installed.
- Anaconda Python 3.13.9 is installed but its directory is not on the process
  PATH; the project may use an explicit interpreter path.
- Node/npm, Flutter/Dart, Docker/Compose, Java, and PostgreSQL client were not
  found on the normal PATH at the start of the audit.
- WSL reports not installed. Firmware virtualization capability was reported
  unavailable by WMI, so Docker/emulator support may require a firmware change.
- Environment variable names were inspected; values were intentionally withheld
  from logs to avoid exposing secrets.
- Read and rendered all 27 pages of `Online_Pharmacy_Database_Design.pdf`.
  Adopted catalogue/inventory separation, FEFO, immutable snapshots/status
  history, UUIDs, decimal money, conservative deletion, and server authority.
- Created branch `codex/milestone-1` and initialized the monorepo contracts.

