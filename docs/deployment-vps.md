# VPS Deployment (App Artifacts Only)

This repository deploys only application artifacts (`api` and `web`) to VPS.
Infrastructure services (Caddy, Supabase, shared network) are managed separately in the `vps-services` repository.

## 1. One-time production hardening (before first pipeline run)

Run on VPS as root:

```bash
# 1) Create deploy user
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# 2) SSH hardening
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
printf '\nAllowUsers deploy\n' >> /etc/ssh/sshd_config
systemctl reload sshd

# 3) Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 4) Security updates
apt-get update
apt-get install -y unattended-upgrades
systemctl enable --now unattended-upgrades
```

## 2. Prepare app runtime directory on VPS

Run as `deploy`:

```bash
mkdir -p /home/deploy/apps/hoop
cd /home/deploy/apps/hoop
```

Copy the env template from this repo:

- `deploy/.env.vps.example` -> `/home/deploy/apps/hoop/.env` (then replace values)

`deploy/compose.vps.yml` is synced automatically by the deploy workflow on each run.

## 3. Create dedicated database user/database (direct Postgres)

Run against internal Postgres (through your admin path):

```sql
CREATE ROLE hoop_app LOGIN PASSWORD '<strong-password>';
CREATE DATABASE hoop OWNER hoop_app;
GRANT ALL PRIVILEGES ON DATABASE hoop TO hoop_app;
```

Set in `/home/deploy/apps/hoop/.env`:

```env
DATABASE_URL=postgresql://hoop_app:<strong-password>@postgres:5432/hoop
```

The deploy workflow now enforces this isolation automatically at deploy time:

- parses `DATABASE_URL` from `/home/deploy/apps/hoop/.env`
- creates the role if missing
- creates the database if missing
- grants privileges to that role
- fails fast if the DB name resolves to `postgres` or `pomodoro`

## 4. GHCR package visibility

Deploy now assumes public GHCR package pulls from the VPS host.

- `hoop-api` and `hoop-web` images should be public in GHCR.
- No GHCR deploy credentials (`GHCR_READ_TOKEN`, `GHCR_USER`) are needed in repository secrets/variables.

## 5. GitHub secrets and variables required in this repository

### Secrets

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `VPS_SSH_KEY` (private key for deploy user)
- `VPS_HOST_KEY` (`ssh-keyscan -H <host>` output)

### Variables

- `CORS_ORIGIN`
- `API_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `VPS_HOST`
- `VPS_USER` (e.g. `deploy`)
- `VPS_APP_DIR` (e.g. `/home/deploy/apps/hoop`)
- `OLLAMA_BASE_URL` (optional)
- `OLLAMA_MODEL` (optional)

### One-shot bootstrap via GitHub CLI

You can set all required values in one shot:

```bash
DATABASE_URL='postgresql://hoop_app:***@postgres:5432/hoop' \
JWT_SECRET='***' \
NEXTAUTH_SECRET='***' \
VPS_SSH_KEY="$(cat ~/.ssh/id_ed25519)" \
VPS_HOST_KEY="$(ssh-keyscan -H your.vps.host 2>/dev/null)" \
CORS_ORIGIN='https://app.example.com' \
API_URL='https://api.example.com/api' \
NEXT_PUBLIC_API_URL='https://api.example.com/api' \
NEXTAUTH_URL='https://app.example.com' \
VPS_HOST='your.vps.host' \
VPS_USER='deploy' \
VPS_APP_DIR='/home/deploy/apps/hoop' \
bash scripts/github/bootstrap-deploy-vars.sh
```

## 6. Caddy routes (in vps-services repo)

Add routes in `vps-services/caddy/Caddyfile` so Caddy proxies to app containers on `vps-net`:

```caddy
app.example.com {
  reverse_proxy hoop-web:3000
}

api.example.com {
  reverse_proxy hoop-api:3001
}
```

Reload from the `vps-services` deployment flow.

## 7. First deployment

Recommended first run:

1. Merge CI/CD changes.
2. Trigger `Deploy` workflow manually (`workflow_dispatch`) with `image_tag=main`.
3. Verify:
   - `https://app.example.com/login`
   - `https://api.example.com/api/health`

## 8. Rollback

Use manual deploy with a previous SHA tag:

- `workflow_dispatch` -> `image_tag=sha-<12-char-commit>`

This redeploys previous immutable images without changing infra repo state.
