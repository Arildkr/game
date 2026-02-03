// game/src/utils/fuzzyMatch.js

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  // Create matrix
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill in the rest
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Check if two strings are similar enough to be considered a match
 * @param {string} guess - The user's guess
 * @param {string} answer - The correct answer
 * @param {number} threshold - Max allowed distance (default: 2 for short words, scales with length)
 * @returns {boolean} - Whether the guess is close enough
 */
export function isFuzzyMatch(guess, answer) {
  // Normalize strings
  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedAnswer = answer.toLowerCase().trim();

  // Exact match
  if (normalizedGuess === normalizedAnswer) return true;

  // If either is empty, no match
  if (!normalizedGuess || !normalizedAnswer) return false;

  // If guess is very short (less than 3 chars), require exact match
  if (normalizedGuess.length < 3) return false;

  // Calculate distance
  const distance = levenshteinDistance(normalizedGuess, normalizedAnswer);

  // Allow threshold based on word length
  // Short words (3-5 chars): allow 1 error
  // Medium words (6-8 chars): allow 2 errors
  // Long words (9+ chars): allow 3 errors
  const maxLength = Math.max(normalizedGuess.length, normalizedAnswer.length);
  let threshold;
  if (maxLength <= 5) {
    threshold = 1;
  } else if (maxLength <= 8) {
    threshold = 2;
  } else {
    threshold = 3;
  }

  return distance <= threshold;
}

/**
 * Check if guess starts with or contains the answer (for partial matches)
 */
export function isPartialMatch(guess, answer) {
  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedAnswer = answer.toLowerCase().trim();

  // Answer contains guess or vice versa
  return normalizedAnswer.includes(normalizedGuess) ||
         normalizedGuess.includes(normalizedAnswer);
}

/**
 * Combined check: fuzzy match or partial match
 */
export function isCloseEnough(guess, answer) {
  return isFuzzyMatch(guess, answer) || isPartialMatch(guess, answer);
}

export default isFuzzyMatch;
