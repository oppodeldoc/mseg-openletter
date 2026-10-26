# MSEG sign-on statement

A public page where people sign MSEG's statement of support, with email-confirmed signatures,
running on infrastructure MSEG controls. Fork of [citizenspring/openletter](https://github.com/citizenspring/openletter) (MIT).

- `frontend/` — Next.js 15, deployed on Vercel at `sign.ousd-mseg.org`
- `api/` — AdonisJS 4.1, Docker container on the-brain at `api.sign.ousd-mseg.org`, Postgres + Postmark

Changes from upstream: English only, no fundraising/passkey code, role dropdown (fixed list, enforced by the API) instead of free-text
occupation, "display my name" toggle (anonymous signers are still counted), letter creation gated
behind `ALLOW_LETTER_CREATE`, all hostnames from env. Everything operational is in [`DEPLOY.md`](DEPLOY.md).

`master` tracks upstream; work happens on `mseg`.
