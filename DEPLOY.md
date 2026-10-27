# DEPLOY.md — MSEG sign-on statement

Operational notes for `sign.ousd-mseg.org`. Verified against the real hosts on 2026-10-26.

## Where things run

| Piece | Where | Notes |
|---|---|---|
| `frontend/` (Next.js 15) | Vercel, project in Matt's personal account, root directory `frontend`, production branch `mseg` | Custom domain `sign.ousd-mseg.org` |
| `api/` (AdonisJS 4.1) | Docker container `openletter-api` on **the-brain** (`24.199.76.234`), defined in `AlephSF/aleph-agents` `docker-compose.yml` | Public host `api.sign.ousd-mseg.org` via the stack's Caddy. Image `ghcr.io/oppodeldoc/mseg-openletter-api:latest`, built by `.github/workflows/api-image.yml` on every push to `mseg` touching `api/` |
| Postgres | the-brain's `postgres` container (postgres:16-alpine), database `openletter`, role `openletter` | Not exposed outside the docker network `funes-net` |
| Outbound email | Postmark SMTP, same server/token as `listmonk-mseg`, From `OUSD MSEG <engage@ousd-mseg.org>`, stream `outbound` | Server token lives only in `~/docker/openletter-api.env` on the-brain (and in Postmark) |
| DNS | Cloudflare zone `ousd-mseg.org` | `sign` = CNAME to Vercel, **DNS-only**; `api.sign` = A `24.199.76.234`, **DNS-only** (grey cloud), like `listmonk.ousd-mseg.org` |

**Not** on the Decidim droplet (`134.199.225.178`, bare-metal Capistrano/nginx) — that box has no Docker.

Access: `ssh -i ~/.ssh/id_digitalocean_rsa oppodeldoc@24.199.76.234` (`oppodeldoc` is in the `docker` group; `root@` with the same key for anything needing sudo). Stack dir `/home/oppodeldoc/docker/`, updated by rsync from the `aleph-agents` repo (see its `docs/setup/runbook.md`).

## API environment (`~/docker/openletter-api.env` on the-brain)

The template is [`api/.env.example`](api/.env.example). Secrets:

- `APP_KEY` — `openssl rand -hex 16`, generated once. **Changing it invalidates every signature confirmation/edit token and the letter edit link.**
- `DATABASE_URL=postgres://openletter:<pw>@postgres:5432/openletter` (no `?ssl` on the docker network).
- `MAIL_USERNAME` / `MAIL_PASSWORD` — the Postmark *server token* for the MSEG server (Postmark → Servers → OUSD MSEG → API Tokens). Must be a server whose default transactional stream is `outbound` (`POSTMARK_STREAM`).
- `CORS_ORIGINS=https://sign.ousd-mseg.org` — exact scheme+host, no trailing slash. A wrong value looks like "nothing happens when I click Sign".
- `ALLOW_LETTER_CREATE=false` except during the one-time creation below.

## First deploy of the API (one time)

```bash
# on the-brain
cd ~/docker
docker exec -it postgres psql -U aleph -d postgres \
  -c "CREATE USER openletter WITH PASSWORD '<pw>';" \
  -c "CREATE DATABASE openletter OWNER openletter;"
cp openletter-api.env.example openletter-api.env && nano openletter-api.env   # fill secrets
docker compose pull openletter-api
docker compose up -d openletter-api
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile   # Caddy issues the cert on first request
```

Verify:

```bash
curl -s https://api.sign.ousd-mseg.org/health            # {"ok":true}
curl -s 'https://api.sign.ousd-mseg.org/letters?limit=1'  # []
docker compose logs --tail=50 openletter-api             # "=== SERVER CONFIGURATION ===" shows host postgres, smtp.postmarkapp.com
docker exec postgres psql -U aleph -d openletter -c '\dt' # letters, signatures, users, tokens, adonis_schema
docker stats --no-stream openletter-api                   # well under the 256 MB mem_limit
```

## Redeploying the API

Push to `mseg` → GitHub Action publishes a new `:latest` → on the-brain:

```bash
cd ~/docker && docker compose pull openletter-api && docker compose up -d openletter-api
```

Migrations run automatically on container start (`node ace migration:run --force && npm start`).

## Vercel

1. Project from `oppodeldoc/mseg-openletter`, Root Directory `frontend`, framework Next.js, Node 22.x, production branch `mseg`.
2. Environment variables (Production + Preview): `API_URL=https://api.sign.ousd-mseg.org`, `PRIVACY_URL=<privacy notice URL>`, `LETTER_SLUG=<slug of the statement>` (after it exists). Leave `ALLOW_LETTER_CREATE` unset. `API_URL` and `LETTER_SLUG` are read at **build** time — redeploy after changing them.
3. Domains → add `sign.ousd-mseg.org`, create the CNAME Vercel shows in Cloudflare (DNS-only).
4. Preview deployments read from the production API but cannot sign (CORS) — expected.

## Publishing the statement (one time)

1. On the-brain set `ALLOW_LETTER_CREATE=true` in `openletter-api.env`, `docker compose up -d openletter-api`. In Vercel set `ALLOW_LETTER_CREATE=true` and redeploy.
2. Visit `https://sign.ousd-mseg.org/create`, enter the statement; the author email receives the **edit link** (`/<slug>/update?token=…`). Store it in 1Password — anyone with it can edit or delete the statement.
3. Set `ALLOW_LETTER_CREATE=false` on both sides again (restart container, redeploy Vercel). Set `LETTER_SLUG=<slug>` in Vercel and redeploy → `/` redirects to the statement.

## Production statement

- Slug: `statement-of-support-for-the-ousd-multi-stakeholder-engagement-group-mseg-ae1488e2` (letter id 4), published 2026-10-27. `LETTER_SLUG` in Vercel points at it, so `/` redirects there.
- **Editing or deleting it later** needs the edit link from the author email *and* `ALLOW_LETTER_CREATE=true` on both sides for the duration (API: `openletter-api.env` + `docker compose up -d --no-deps --force-recreate openletter-api`; Vercel: add the env var + redeploy), then flip both back. Update/delete are gated together with create.

## Day-to-day

- **Remove a signature** (email request): `docker exec -it postgres psql -U aleph -d openletter -c "SELECT id, name, occupation, created_at FROM signatures WHERE email = '…' OR name ILIKE '%…%';"` then `DELETE FROM signatures WHERE id = N;`
- **Export signers**: `docker exec postgres psql -U aleph -d openletter -c "\copy (SELECT name, show_name, occupation, organization, city, is_verified, created_at FROM signatures ORDER BY created_at) TO STDOUT CSV HEADER" > signers.csv`
- **Anonymous signers**: `show_name = false`; the name is stored but the API returns `name: null` for them.
- **Backups**: `~/docker/scripts/backup-postgres.sh` dumps `openletter` (plus the listmonk DBs) nightly to `~/backups/`, 14-day retention. Restore: `docker exec -i postgres pg_restore -U aleph -d openletter --clean < ~/backups/openletter-<date>.dump`. No off-site copy yet.
- **Logs**: `docker compose logs -f openletter-api`; Caddy access log `~/docker/caddy/data/logs/openletter-api-access.log`.

## Known limits

- AdonisJS 4 is unmaintained upstream; keep the container's surface small (only Caddy-fronted routes, `trustProxy` on, Node 22 base).
- No CAPTCHA — email confirmation is the spam gate, plus one signature per IP per 30 s. If bots appear, add Cloudflare Turnstile to `SignatureForm.js` and verify the token in `LetterController.sign`.
- No self-service "withdraw my signature"; handle by email + the `DELETE` above (say so in the privacy notice).
