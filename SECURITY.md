# Security Policy and MVP Boundaries

Milestone 1 uses Django password hashing, short-lived JWT access tokens, rotated
refresh tokens, HTTP-only cookies for the website proxy, object-level ownership,
server-side price/stock validation, validated status transitions, upload
restrictions, and non-production demo data.

Google login sends the provider-issued ID token to Django over the normal API
path. Django verifies its signature, audience, issuer, expiry, subject, and
verified-email claims with Google's maintained authentication library before
issuing Darmalton JWTs. Provider subjects are stored separately from mutable
email addresses. The Google client secret is server-only; the current ID-token
verification flow does not expose or require it in either customer client.

Never report vulnerabilities with real patient, prescription, credential, or
payment data. This MVP does not provide prescription review, online payments,
production secrets management, compliance certification, anti-fraud controls,
malware scanning, production-grade rate limiting, or a completed legal review.

Before production: add a managed secret store, TLS, secure cookie enforcement,
reverse-proxy rate limits for auth, private object storage and malware scanning,
encrypted/tested backups, monitoring, dependency scanning, penetration testing,
Google OAuth consent-screen verification, data-retention rules, and review by
qualified pharmacy/privacy/legal advisers.
