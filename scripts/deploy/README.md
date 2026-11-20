# DutyDeck backend deployment

The Vite frontend runs on Vercel. The Express API runs on Oracle Linux 9 at `152.67.15.185`, behind Caddy at `https://api-152-67-15-185.sslip.io`. Deployment is not complete until HTTPS and the Vercel proxy have passed the checks below.

## Server adjustments

On this 1 GB instance, the UEK boot reserved 448 MB for kdump, leaving only 498 MB usable. With explicit owner approval, `stabilize-memory.sh` disabled kdump, released the reservation without a reboot, removed the reservation from future boot entries, and enabled bounded persistent journals. Usable memory returned to 946 MB. Full kernel crash dumps are unavailable under this configuration; system and app journals remain available.

The PDF virtual environment must be root-owned with group read/execute access for `prepapp`. App code stays read-only to that account. When importing textbook archives, set cached files to the service account and restrict their permissions.

NCERT served an incomplete Let's Encrypt chain. `configure-ncert-ca.sh` obtains official cross-signed certificates from letsencrypt.org, validates them against existing OS trust anchors, and configures an application-only bundle. It does not disable TLS verification or change global trust. The source can still time out independently; an existing original textbook cache is used when available.

## Build and verify

Run `npm ci`, `npm run lint`, `node --import tsx --test src/utils/*.test.ts server/*.test.ts`, `npm run build`, and `npm run build:server`. Run `node scripts/deploy/verify-local.mjs` to check the production API locally with an original textbook PDF. It requires Python with PyMuPDF and pdfplumber installed.

`node scripts/deploy/package-backend.mjs` prepares `build/backend/` and a private `build/backend.keys.env`, using only existing provider configuration from `.env`. Never commit or upload that keys file to Vercel. Generate the backend lockfile with `npm install --package-lock-only --ignore-scripts --omit=dev --prefix build/backend`; copy `backup.py` into that directory, then archive it as `build/backend.tar.gz`.

## Server installation

Run `provision.sh` as root on the server. It verifies the pinned Node archive checksum for x86_64 or ARM64, installs matching Caddy and PDF dependencies, creates separate unprivileged service accounts, opens only HTTP/HTTPS in addition to the existing SSH access, and configures key-only SSH. Keep the existing SSH session open while validating a second login.

Upload the archive as `/home/opc/prepapp-backend.tar.gz`, deployment service files and Caddyfile to `/home/opc/prepapp-units/`, and `install-release.sh` into `/home/opc`. Transfer the keys file through an encrypted SSH connection with `umask 077` to `/home/opc/prepapp.keys.env`. Run `sudo bash install-release.sh <unique-release-id>`. The installer merges allowed provider settings into `/etc/prepapp/backend.env` and removes the temporary key transfer file. It does not overwrite the session signing secret.

Code lives in root-owned `/opt/prepapp/releases/`, with `/opt/prepapp/current` selecting the active release. The API runs as `prepapp` on `127.0.0.1:3000`, with writes restricted to `/var/lib/prepapp`. Caddy exposes HTTPS and renews certificates automatically. Oracle Cloud ingress must separately allow TCP 80 and 443; leave port 3000 closed. DNS for the free sslip.io hostname is operated by a third party; replace it with an owned API domain when available.

## Authentication and limits

Add `prepapp-five.vercel.app` to Firebase Authentication's authorized domains. Google ID tokens are checked against Google's signing keys, issuer, audience, expiry, verified email, and Google sign-in provider. No Firebase administrative credential is needed for signature verification. Token revocation and account-disable checks are not available with this verification path; an already issued ID token can remain valid until its normal expiry.

Guests get a signed, Secure, HttpOnly, SameSite=Lax cookie. They can read textbooks and keep separate notes, but cannot use paid AI. Notes are stored in an owner-scoped SQLite database; historical shared notes are not exposed to arbitrary users. The browser sends Firebase ID tokens with API calls and uses the same-origin Vercel API proxy, so no token is placed in URLs.

Defaults: 6 AI requests per minute per account, 30 per account per UTC day, 100 total per day, two concurrent AI requests, one concurrent PDF preparation, 500 notes per user, and a 256 KB request body limit. Daily AI counts persist across restarts. These are request limits, not a guaranteed currency budget; also configure billing limits with the AI provider. Guest sessions expire after seven days. Change limits and allowed origins in the root-controlled environment file, then restart `prepapp`.

## Publish and check

First verify `https://api-152-67-15-185.sslip.io/api/health`, then run `API_BASE_URL=https://api-152-67-15-185.sslip.io node scripts/deploy/verify-api.mjs`. Verify TLS without bypassing certificate validation. Add a Vercel rewrite before the SPA fallback: `/api/:path*` to `https://api-152-67-15-185.sslip.io/api/:path*`. Deploy and rerun the same script with `API_BASE_URL=https://prepapp-five.vercel.app`, ensuring the proxy preserves session cookies. Verify Google sign-in and a paid AI request with a real user session before calling the complete flow verified.

Use `systemctl status prepapp caddy` and `journalctl -u prepapp -u caddy --since '10 minutes ago'` for bounded troubleshooting. To roll back, point `/opt/prepapp/current` to a previous verified release and restart `prepapp`. Never print the environment file or tokens in troubleshooting output.

`prepapp-backup.timer` takes consistent daily SQLite snapshots and retains 14 days under `/var/lib/prepapp/backups`. These snapshots are local to the server; off-server backup storage and monitoring still need to be arranged. Test restoration to a separate database before relying on snapshots for recovery. Provider secrets are not included in database backups.
