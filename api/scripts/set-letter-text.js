#!/usr/bin/env node
'use strict';
/*
 * Replace a published statement's body (and optionally its title) in place,
 * keeping the slug, locale and signatures. Applies the same sanitize-html
 * pass as letter creation, so the result renders exactly as if it had been
 * published through /create.
 *
 * Usage (inside the API container, DATABASE_URL comes from its env):
 *   docker exec -i openletter-api node scripts/set-letter-text.js <slug> [--locale en] [--title "New title"] < new-text.md
 *   docker exec -i openletter-api node scripts/set-letter-text.js <slug> --dry-run < new-text.md   # print, don't write
 */
const sanitizeHtml = require('sanitize-html');
const { Client } = require('pg');

function parseArgs(argv) {
  const args = { locale: 'en', dryRun: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--locale') args.locale = argv[++i];
    else if (a === '--title') args.title = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else rest.push(a);
  }
  args.slug = rest[0];
  return args;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug) {
    console.error('usage: set-letter-text.js <slug> [--locale en] [--title "..."] [--dry-run] < text.md');
    process.exit(2);
  }
  const raw = (await readStdin()).replace(/\r\n/g, '\n').trim();
  if (!raw) {
    console.error('no text on stdin');
    process.exit(2);
  }
  // identical to Letter.createWithLocales
  const text = sanitizeHtml(raw, { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']) });

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query(
      'SELECT id, title, length(text) AS len FROM letters WHERE slug = $1 AND locale = $2 AND deleted_at IS NULL',
      [args.slug, args.locale],
    );
    if (rows.length !== 1) {
      console.error(`expected exactly one letter for slug=${args.slug} locale=${args.locale}, found ${rows.length}`);
      process.exit(1);
    }
    const letter = rows[0];
    console.log(`letter #${letter.id} "${letter.title}": ${letter.len} chars -> ${text.length} chars`);
    if (args.title) console.log(`title -> "${args.title}"`);
    if (args.dryRun) {
      console.log('--- sanitized text (dry run, nothing written) ---');
      console.log(text);
      return;
    }
    const res = await client.query(
      'UPDATE letters SET text = $1, title = COALESCE($2, title), updated_at = NOW() WHERE id = $3',
      [text, args.title || null, letter.id],
    );
    console.log(`updated ${res.rowCount} row`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
