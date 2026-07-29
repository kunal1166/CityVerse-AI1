/**
 * Environment loading for CityVerse AI.
 *
 * dotenv's default entrypoint only reads `.env`. This project documents
 * `.env.local` (which is git-ignored), so we load both explicitly with
 * `.env.local` taking precedence.
 *
 * This module must be imported FIRST in server/index.ts: ES module imports are
 * evaluated in order, so this side effect runs before any module that reads
 * process.env at import time.
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Resolve relative to this file, so it works no matter which directory
// `npm run dev` was launched from.
//
// We deliberately use __dirname instead of import.meta.url here: this file
// runs both as an ES module (via tsx in dev) and bundled to CJS (via esbuild
// for production, see package.json's "build" script). esbuild's CJS output
// format leaves import.meta.url undefined, which crashes fileURLToPath() at
// startup. __dirname works correctly in both cases.
const root = path.resolve(__dirname, '..');

// Highest priority first. Values already set win, so .env.local overrides .env.
for (const file of ['.env.local', '.env']) {
  const full = path.join(root, file);
  if (fs.existsSync(full)) {
    // quiet: suppress dotenv v17's startup banner so the boot log stays clean.
    dotenv.config({ path: full, quiet: true });
  }
}