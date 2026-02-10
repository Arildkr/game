// Generate ordjaktWords.js from Norsk Ordbank fullformsliste (includes inflections)
// Run: node generateWordList.js

import { readFileSync, writeFileSync } from 'fs';

function extractFullforms(path, encoding = 'latin1') {
  console.log(`Reading ${path}...`);
  const content = readFileSync(path, encoding);
  const lines = content.split(/\r?\n/);
  console.log(`  ${lines.length} raw lines`);

  // Tab-separated: column 3 (index 2) is the word form (OPPSLAG)
  const regex = /^[a-zæøåéèêóòâ]{3,8}$/;
  const all = new Set();

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 3) continue;
    const word = cols[2].trim().toLowerCase();
    if (regex.test(word)) {
      all.add(word);
    }
  }

  const words = [...all].sort();
  const eightLetter = words.filter(w => w.length === 8);
  console.log(`  ${words.length} unique words (3-8 chars), ${eightLetter.length} with 8 letters`);
  return words;
}

// Bokmål: fullformsliste.txt
const nob = extractFullforms('data/fullformsliste.txt');
// Nynorsk: fullformer_2012.txt
const nno = extractFullforms('data/fullformer_2012.txt');

// Test some inflected forms
console.log('\nInflection check (bokmål):');
const nobSet = new Set(nob);
for (const w of ['hest', 'hester', 'hesten', 'hestene', 'løper', 'løpende', 'skriver', 'bøker', 'barn', 'barna']) {
  console.log(`  ${w}: ${nobSet.has(w) ? 'YES' : 'NO'}`);
}

// Build JS module
let output = `// Auto-generated Norwegian word lists for Ordjakt
// Source: Norsk Ordbank fullformsliste (Språkrådet/Språkbanken)
// Includes all inflected forms (bøyningsformer)
// Generated: ${new Date().toISOString()}

const NOB_WORDS = ${JSON.stringify(nob)};

const NNO_WORDS = ${JSON.stringify(nno)};

const cache = {};

export function getOrdjaktWordList(variant) {
  if (cache[variant]) return cache[variant];
  const words = variant === 'nno' ? NNO_WORDS : NOB_WORDS;
  const all = new Set(words);
  const eightLetter = words.filter(w => w.length === 8);
  console.log(\`Ordjakt: Loaded \${variant} - \${all.size} words (\${eightLetter.length} with 8 letters)\`);
  cache[variant] = { all, eightLetter };
  return cache[variant];
}
`;

writeFileSync('ordjaktWords.js', output, 'utf-8');
console.log(`\nGenerated ordjaktWords.js: ${Math.round(output.length / 1024)} KB`);
