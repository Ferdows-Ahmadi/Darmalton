# Darmalton Pharmacy Mobile

Flutter client for the Darmalton Milestone 1 customer flow. The application uses
Riverpod for state, Dio for API requests, go_router for navigation, and platform
secure storage for authentication tokens.

## Android development

Start the local stack and automatic connectivity support with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\dev-up.ps1
```

Use `-ConfigureFirewall` once from an Administrator PowerShell. The command
starts the Docker services, publishes a development-only UDP discovery service,
updates the current private address in the ignored `.env`, verifies health, and
configures ADB reverse for connected devices.

The same installed debug APK resolves endpoints in a bounded order: USB
localhost, discovered LAN server, last successful LAN server, then an explicit
manual override. The debug diagnostics screen shows the selected endpoint,
method, health, and last success. It is available from Settings and from sign-in
when account/API access is unavailable.

The API client accepts a host URL, `/api`, or `/api/v1` form and normalizes it to
one trailing-slash-free `/api/v1` base. Debug builds permit local cleartext HTTP;
release builds do not opt into cleartext, never run discovery, and must receive
an explicit HTTPS production URL.

## Brand assets and typography

The supplied Darmalton wordmark and launcher artwork live under
`assets/branding/`. The app uses the bundled Vazirmatn 33.003 Regular, Medium,
and Bold fonts for clear Dari text. Vazirmatn is distributed under the SIL Open
Font License 1.1; its license is preserved at `assets/fonts/OFL.txt`.

## iOS

The iOS runner is committed for source compatibility. Compilation, CocoaPods,
signing, and device testing require macOS with current Xcode.
