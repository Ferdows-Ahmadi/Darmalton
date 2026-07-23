# Security Policy and MVP Boundaries

Milestone 1 uses Django password hashing, short-lived JWT access tokens, rotated
refresh tokens, HTTP-only cookies for the website proxy, object-level ownership,
server-side price/stock validation, validated status transitions, upload
restrictions, and non-production demo data.

Never report vulnerabilities with real patient, prescription, credential, or
payment data. This MVP does not provide prescription review, online payments,
production secrets management, compliance certification, anti-fraud controls,
malware scanning, production-grade rate limiting, or a completed legal review.

Before production: add a managed secret store, TLS, secure cookie enforcement,
reverse-proxy rate limits for auth, private object storage and malware scanning,
encrypted/tested backups, monitoring, dependency scanning, penetration testing,
data-retention rules, and review by qualified pharmacy/privacy/legal advisers.

