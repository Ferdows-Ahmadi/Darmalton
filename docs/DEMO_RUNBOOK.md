# Darmalton Meeting Demo Runbook

This runbook starts the existing PostgreSQL, Django, Next.js, staff portal, and
Flutter demo without deleting Docker volumes or reseeding working data.

## One-time laptop preparation

Connect the laptop and teammates' devices to the same private Wi-Fi. Start
Docker Desktop and wait for the engine to report that it is running. Connect
the unlocked Pixel by USB, enable USB debugging, and accept the computer's RSA
prompt.

Open **PowerShell as Administrator** once and run:

```powershell
cd C:\Users\AFerd\Documents\Darmalton
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\demo-start.ps1 -ConfigureFirewall
```

This adds Private-profile inbound rules for the website (TCP 3000), API/Admin
(TCP 8000), and debug mobile discovery (UDP 53535). Do not enable these rules on
a Public network.

## Normal meeting start

From a regular PowerShell window:

```powershell
cd C:\Users\AFerd\Documents\Darmalton
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\demo-start.ps1
```

The command verifies Docker and ADB, starts the existing containers, waits for
health, preserves PostgreSQL data, configures the USB tunnel, builds only when
mobile sources changed, installs the current debug APK when needed, launches
the app, and prints the current Wi-Fi URLs.

Useful variants:

```powershell
# Rebuild and reinstall the current Flutter sources once.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\demo-start.ps1 -ForceBuild

# Use Wi-Fi instead of the USB API tunnel (same private Wi-Fi required).
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\demo-start.ps1 -Mode lan
```

## Access links

On the laptop:

| Application | URL |
|---|---|
| Public website | `http://localhost:3000/` |
| Customer shop | `http://localhost:3000/shop` |
| Staff dashboard | `http://localhost:3000/staff` |
| Staff sign-in | `http://localhost:3000/staff/login` |
| CMS management | `http://localhost:3000/staff/cms` |
| Django Admin | `http://localhost:8000/admin/` |
| API documentation | `http://localhost:8000/api/docs/` |
| Backend health | `http://localhost:8000/api/v1/health/` |

For teammates, replace `localhost` with the IPv4 address printed by
`demo-start.ps1`. On the currently verified network it is `192.168.0.113`, so
the public site is `http://192.168.0.113:3000/`. DHCP can change this address;
always trust the links printed on meeting day.

## Demo-only accounts

| Role | Email | Password | Use |
|---|---|---|---|
| Customer | `customer@example.test` | `ChangeMe-Customer-123!` | Website and Pixel |
| Pharmacist | `pharmacist@example.test` | `ChangeMe-Pharmacist-123!` | Staff prescription review |
| Administrator | `admin@example.test` | `ChangeMe-Admin-123!` | Staff portal and Django Admin |

These credentials are local demo defaults only. Never deploy them.

## Preparing content before presenting

### Home banners

Open `http://localhost:3000/staff/cms/banners`, choose **Create banner**, and
create up to four `HOME_HERO` banners. Use Dari and English titles, a 16:9 image
(recommended 1600x900), an internal action such as `/shop`, an active schedule,
and then publish it. Accepted server formats are JPEG, PNG, and WebP up to 5 MiB
and 128-6000 pixels per side. The Pixel carousel updates from the CMS without an
APK rebuild. Zero visible banners hides the carousel; one is static; two or
more auto-advance every six seconds and remain swipeable.

### Medicine images

Open `http://localhost:8000/admin/catalog/medicine/` and edit a medicine's
image inline, or use `http://localhost:8000/admin/catalog/medicineimage/add/`.
Select the medicine, upload an image, enter useful alt text, and mark the main
image primary. Refresh the client; no rebuild is required. To list missing
images:

```powershell
docker compose exec -T backend python manage.py report_missing_medicine_images
```

The app shows a polished neutral medicine fallback until licensed images are
provided.

## Suggested presentation order

1. Open the public site, shop, search, filter, and inspect a product.
2. On Pixel, show Dari-first RTL, switch to English, relaunch to show persistence,
   then return to Dari.
3. Show address creation/map selection, cart, and cash-on-delivery checkout.
4. Upload a prescription from camera, gallery, or file and show its history.
5. In the staff portal, open Prescriptions and perform review/clarification.
6. Show CMS banner management and the resulting Pixel home carousel.
7. Show inventory, suppliers, procurement, returns, reports, and Django Admin.

## Recovery and shutdown

- Offline Pixel: keep USB connected and rerun `demo-start.ps1`; it recreates
  `adb reverse tcp:8000 tcp:8000`. Use `-Mode lan` only on the same private Wi-Fi.
- Unauthorized Pixel: unlock it, reconnect USB, approve the RSA prompt, and
  confirm `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe devices` says
  `device` rather than `unauthorized`.
- Website unavailable to teammates: confirm the printed IP, Private Wi-Fi
  profile, firewall rules, and that the access point does not isolate clients.
- Service failure: run `docker compose ps` and
  `docker compose logs backend website --tail 100`.
- Stop after the meeting with `docker compose stop`. This preserves the database.
  Do not use `docker compose down -v` unless intentionally deleting demo data.

## Honest demo limitations

Cash on delivery is the only enabled payment method. Live courier GPS/tracking,
gateway payments/refunds, wallet balances, push notifications, and nearby-store
distance calculations are not simulated. Public website CMS consumption is not
yet implemented; the current CMS carousel is in Flutter. Product photography
must be supplied by the operator. Google sign-in needs external OAuth
credentials. iOS remains unverified on Windows.
