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

const root = process.cwd();

// Highest priority first. Values already set win, so .env.local overrides .env.
for (const file of ['.env.local', '.env']) {
  const full = path.join(root, file);
  if (fs.existsSync(full)) {
    // quiet: suppress dotenv v17's startup banner so the boot log stays clean.
    dotenv.config({ path: full, quiet: true });
  }
}
