# Hostinger Deployment

## Environment evidence

The project brief reports a KVM 2 VPS in Mumbai 2 with Ubuntu 24.04.4, about
8 GB RAM/100 GB NVMe, Docker 29.7.2, Compose 5.4.0, an existing host-network
Traefik on 80/443, HTTPS redirect and Let's Encrypt resolver, firewall rules
limited to 22/80/443, weekly backups and malware scanning. Treat this as
operator-reported until re-read through hPanel/connector immediately before
deployment.

The Hostinger Connector MCP servers were registered, but the read-only VPS
server timed out during MCP handshake in this release session. Therefore VPS
identity, live firewall/DNS/backups/metrics and the exact Traefik resolver/network
configuration remain OPEN; no Hostinger resource was changed.

## Traefik compatibility gate

`docker-compose.production.yml` uses Docker labels, `websecure`, a configurable
certificate resolver and the named bridge `darmalton_edge`. Because the existing
Traefik reportedly uses host networking, confirm on the VPS that its Docker
provider can reach container IPs on this bridge. If not, use loopback-only bind
ports plus a reviewed Traefik file-provider route; never publish 3000/8000 or
5432 to all interfaces and never deploy a second reverse proxy by default.

## GitHub/Hostinger automation decision

Hostinger documents its Docker deployment action; the current Marketplace
release is `hostinger/deploy-on-vps@v2`. It accepts a VM ID, API key, Compose
path and environment variables. It is not enabled here because its documented
interface has no explicit pre-migration database backup, migration-plan approval
or post-deploy rollback hook required by Darmalton.

Use the repository CI workflow to gate changes, create an immutable reviewed
release tag, then perform the first deployment manually. After that succeeds,
use `scripts/production/deploy-update.sh` through a least-privilege SSH deploy
user. Reconsider the Hostinger action only after a staging rehearsal proves
backup, migration, health and rollback behavior. Store Hostinger/GitHub/SSH
secrets outside Git and protect the `production` GitHub environment with manual
approval.

Official references:

- https://www.hostinger.com/support/deploy-to-hostinger-vps-using-github-actions/
- https://github.com/marketplace/actions/deploy-on-hostinger-vps
