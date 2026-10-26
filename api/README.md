# MSEG sign-on API

AdonisJS 4.1 service behind `https://api.sign.ousd-mseg.org`. Fork of the
[openletter.earth](https://github.com/citizenspring/openletter) API; see [`../DEPLOY.md`](../DEPLOY.md)
for how it is built, configured and run on the-brain.

## Local development

```bash
docker run --rm -d --name openletter-pg -e POSTGRES_PASSWORD=x -p 5433:5432 postgres:16-alpine
cp .env.example .env   # then set DATABASE_URL=postgres://postgres:x@localhost:5433/postgres, APP_KEY, MAIL_* (or MAIL_CONNECTION=ethereal)
npm install
node ace migration:run
node ace serve --dev
```

## Tests

`.env.testing` is picked up automatically and uses the `openletter_test` database on the same server:

```bash
docker exec openletter-pg psql -U postgres -c 'CREATE DATABASE openletter_test;'
DATABASE_URL=postgres://postgres:x@localhost:5433/openletter_test node ace migration:run --force
DATABASE_URL=postgres://postgres:x@localhost:5433/openletter_test node ace test
```
