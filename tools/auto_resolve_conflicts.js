const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function shouldSkip(file) {
  const lower = file.toLowerCase();
  if (lower.includes('package-lock.json')) return true;
  if (lower.endsWith('package.json')) return true;
  return false;
}

const repoRoot = path.resolve(__dirname, '..');
const allFiles = walk(repoRoot);
const conflictFiles = [];
const modified = [];

for (const file of allFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('<<<<<<< HEAD')) continue;
    conflictFiles.push(file);
    if (shouldSkip(file)) {
      console.log('Skipping (by policy):', file);
      continue;
    }

    const newContent = content.replace(/<<<<<<< HEAD\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>>[^\n]*\n?/g, (m, a, b) => {
      const aTrim = a.trim();
      const bTrim = b.trim();
      if (aTrim === bTrim) return a; // identical
      if (a.includes(b) && aTrim.length > bTrim.length) return a; // a contains b
      if (b.includes(a) && bTrim.length > aTrim.length) return b; // b contains a
      // if JSON file, prefer b (incoming) to avoid partial merges
      if (file.endsWith('.json') || file.endsWith('.lock')) return b;
      // fallback: prefer incoming (b)
      return b;
    });

    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      modified.push(file);
      console.log('Resolved:', file);
    } else {
      console.log('No change after resolution for:', file);
    }
  } catch (err) {
    console.error('Error processing', file, err.message);
  }
}

console.log('\nSummary:');
console.log('Conflicted files found:', conflictFiles.length);
console.log('Files modified:', modified.length);
if (modified.length > 0) console.log('Modified list:\n' + modified.join('\n'));
process.exit(0);
