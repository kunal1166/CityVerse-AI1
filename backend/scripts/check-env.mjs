#!/usr/bin/env node
/**
 * CityVerse AI — setup checker.
 * Run with: npm run setup
 *
 * Verifies Node version, creates .env.local if missing, and reports
 * which AI provider will be used at runtime.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

console.log(bold('\n  CityVerse AI — setup check\n'));

// 1. Node version
const major = Number(process.versions.node.split('.')[0]);
if (major >= 18) {
  console.log(`  ${green('OK')}  Node.js ${process.versions.node}`);
} else {
  console.log(`  ${red('!!')}  Node.js ${process.versions.node} — version 18 or newer is required.`);
  process.exitCode = 1;
}

// 2. Dependencies installed
if (fs.existsSync(path.join(root, 'node_modules'))) {
  console.log(`  ${green('OK')}  Dependencies installed`);
} else {
  console.log(`  ${yellow('--')}  node_modules missing — run: npm install`);
}

// 3. .env.local
const envPath = path.join(root, '.env.local');
const examplePath = path.join(root, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log(`  ${green('OK')}  Created .env.local from .env.example`);
  } else {
    console.log(`  ${yellow('--')}  No .env.local and no .env.example to copy from`);
  }
} else {
  console.log(`  ${green('OK')}  .env.local present`);
}

// 4. Which provider is configured?
let envText = '';
try {
  envText = fs.readFileSync(envPath, 'utf8');
} catch {
  /* ignore */
}

const readVar = (name) => {
  // [ \t]* rather than \s* so the match cannot run across a newline.
  const match = envText.match(new RegExp(`^[ \\t]*${name}[ \\t]*=[ \\t]*(.*)$`, 'm'));
  if (!match) return '';
  return match[1]
    .split('#')[0] // drop trailing inline comment
    .trim()
    .replace(/^["']|["']$/g, '');
};

const providers = [
  ['anthropic', 'ANTHROPIC_API_KEY', 'Anthropic Claude'],
  ['openai', 'OPENAI_API_KEY', 'OpenAI'],
  ['groq', 'GROQ_API_KEY', 'Groq'],
  ['openrouter', 'OPENROUTER_API_KEY', 'OpenRouter'],
];

const explicit = readVar('AI_PROVIDER').toLowerCase();
const withKey = providers.filter(([, key]) => readVar(key).length > 0);

if (explicit === 'ollama') {
  console.log(`  ${green('OK')}  AI provider: Ollama (local, no key needed)`);
  console.log(`        Make sure Ollama is running: ollama serve`);
} else if (explicit && explicit !== 'none') {
  const found = providers.find(([id]) => id === explicit);
  if (found && readVar(found[1])) {
    console.log(`  ${green('OK')}  AI provider: ${found[2]} (explicitly selected)`);
  } else {
    console.log(`  ${yellow('--')}  AI_PROVIDER="${explicit}" but its API key is empty — will use offline mode`);
  }
} else if (withKey.length > 0) {
  console.log(`  ${green('OK')}  AI provider: ${withKey[0][2]} (auto-detected)`);
  if (withKey.length > 1) {
    const others = withKey.slice(1).map((p) => p[2]).join(', ');
    console.log(`        Also found keys for: ${others}. Set AI_PROVIDER to choose explicitly.`);
  }
} else {
  console.log(`  ${yellow('--')}  No AI key set — running in offline briefing mode`);
  console.log(`        This is fine for a demo. Add a key to .env.local for live AI.`);
  console.log(`        Free option: get a Groq key at https://console.groq.com/keys`);
}

console.log(bold('\n  Ready. Start the app with: npm run dev\n'));
