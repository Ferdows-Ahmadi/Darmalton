# Android Release

Current identity is `com.darmalton.pharmacy`, version `1.0.0`, versionCode `1`.
Increase versionCode for every Play upload; use semantic versionName changes for
user-visible releases.

## Signing

Create the production keystore offline with `keytool`, store it outside the
repository, back it up securely, and restrict access. Create the ignored
`mobile/android/key.properties` containing only:

```properties
storeFile=C:\\secure-path\\darmalton-upload.jks
storePassword=REPLACE
keyAlias=upload
keyPassword=REPLACE
```

The Gradle build uses this release configuration only when the file exists.
`key.properties`, `*.jks` and `*.keystore` are Git-ignored. Never reuse debug
signing for production.

Build the Play bundle with the final HTTPS API and optional Google web client:

```powershell
flutter build appbundle --release `
  --dart-define=API_BASE_URL=https://api.example.com/api/v1 `
  --dart-define=GOOGLE_CLIENT_ID=<web-client-id>.apps.googleusercontent.com
```

Before upload, inspect signing certificates with `keytool -list -v`, install a
signed release APK on a non-development device, and repeat the final acceptance
checklist. Configure Play App Signing and retain the upload-key recovery data.

## Google and Play disclosures

Google Cloud requires an Android OAuth client for package
`com.darmalton.pharmacy` with SHA-1 and SHA-256 for the upload/release
certificate, plus the Web OAuth client ID used as the backend token audience.
The current ID-token flow requires no client secret or redirect URI; the web
client needs the final HTTPS website origin for Google Identity Services.

The privacy policy and Play Data Safety form must accurately disclose account
data, orders, delivery addresses, optional location use, prescription/photo/file
uploads, medical allergies/notes, diagnostics, retention/deletion and TLS in
transit. Camera and location are runtime permissions used only for explicit
prescription capture and address selection. Publish a stable HTTPS privacy URL
before Play submission.

Production signing, Play Console configuration and live Google credentials are
external requirements; the current unsigned compile path is not Play-ready.

## Release-candidate artifacts

- Debug APK: `mobile/build/app/outputs/flutter-apk/app-debug.apk`
  (`4B90A06C25DE89920528319D72ABEF2BA6ED7A29C68F95A7C8F578CE834D80C2`).
- Unsigned release-mode AAB:
  `mobile/build/app/outputs/bundle/release/app-release.aab`
  (`3976D87C0CE2017A1731D7EAA5E5E30F211DA342DD6E648C490FA2FF3F820558`).

The AAB is compile evidence only because `mobile/android/key.properties` is
absent. Rebuild after configuring the protected upload key and final HTTPS API;
do not upload this unsigned candidate to Play.
