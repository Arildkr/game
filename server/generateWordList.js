// One-time script to generate ordjaktWords.js from raw word list files
// Run: node generateWordList.js

import { readFileSync, writeFileSync } from 'fs';

function filterWords(path) {
  const content = readFileSync(path, 'utf-8');
  const lines = content.split(/\r?\n/).map(w => w.trim().toLowerCase());
  const regex = /^[a-zæøåéèêóòâ]{3,8}$/;
  return [...new Set(lines.filter(w => regex.test(w)))];
}

const nob = filterWords('data/wordlist_20220201_norsk_ordbank_nob_2005.txt');
const nno = filterWords('data/wordlist_20220201_norsk_ordbank_nno_2012.txt');

console.log('Bokmål:', nob.length, 'words,', nob.filter(w => w.length === 8).length, 'with 8 letters');
console.log('Nynorsk:', nno.length, 'words,', nno.filter(w => w.length === 8).length, 'with 8 letters');

// Build JS module with JSON arrays
let output = `// Auto-generated Norwegian word lists for Ordjakt
// Source: Norsk Ordbank (Språkrådet)
// Filtered: 3-8 character pure alphabetic words
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
console.log('Generated ordjaktWords.js:', Math.round(output.length / 1024), 'KB');
