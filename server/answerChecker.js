// server/answerChecker.js
// Levenshtein-basert svar-sjekking for quiz og gjett-bildet

/**
 * Beregner Levenshtein-distanse mellom to strenger
 * @param {string} a - Første streng
 * @param {string} b - Andre streng
 * @returns {number} - Antall redigeringer (innsettinger, slettinger, erstatninger)
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  // Initialiser matrisen
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fyll ut matrisen
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // erstatning
          matrix[i][j - 1] + 1,     // innsetting
          matrix[i - 1][j] + 1      // sletting
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normaliserer en streng for sammenligning
 * - Fjerner mellomrom i starten og slutten
 * - Konverterer til lowercase
 * - Fjerner ekstra mellomrom
 * - Fjerner vanlige tegn som ikke påvirker meningen
 * @param {string} str - Streng som skal normaliseres
 * @returns {string} - Normalisert streng
 */
function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';

  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')           // Erstatt multiple mellomrom med ett
    .replace(/[.,\-!?'"()]/g, '')   // Fjern vanlige tegnsettingstegn
    .normalize('NFD')               // Normaliser unicode
    .replace(/[\u0300-\u036f]/g, '') // Fjern diakritiske tegn (æøå beholdes)
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a');
}

/**
 * Sjekker om et svar er riktig ved å sammenligne med gyldige svar
 * @param {string} playerAnswer - Spillerens svar
 * @param {string|string[]} correctAnswers - Riktig(e) svar (kan være string eller array)
 * @param {Object} options - Valgfrie innstillinger
 * @param {number} options.threshold - Maks Levenshtein-distanse for godkjenning (default: 2)
 * @param {boolean} options.exactMatch - Krev eksakt match (default: false)
 * @returns {Object} - { isCorrect: boolean, matchedAnswer: string|null, distance: number }
 */
export function checkAnswer(playerAnswer, correctAnswers, options = {}) {
  const { threshold = 2, exactMatch = false } = options;

  // Normaliser spillerens svar
  const normalizedPlayerAnswer = normalizeString(playerAnswer);

  if (!normalizedPlayerAnswer) {
    return { isCorrect: false, matchedAnswer: null, distance: Infinity };
  }

  // Sjekk om spillerens svar er et rent tall
  const isNumericPlayerAnswer = /^\d+$/.test(playerAnswer.trim());

  // Konverter til array hvis nødvendig
  const answersArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];

  let bestMatch = null;
  let bestDistance = Infinity;

  for (const correctAnswer of answersArray) {
    const normalizedCorrect = normalizeString(correctAnswer);

    if (!normalizedCorrect) continue;

    // Sjekk om riktig svar er et rent tall
    const isNumericCorrectAnswer = /^\d+$/.test(correctAnswer.trim());

    // Eksakt match (etter normalisering)
    if (normalizedPlayerAnswer === normalizedCorrect) {
      return { isCorrect: true, matchedAnswer: correctAnswer, distance: 0 };
    }

    // For tallsvar: KREVER eksakt match
    // Dette forhindrer at "6" matcher "8" eller lignende
    if (isNumericPlayerAnswer && isNumericCorrectAnswer) {
      // Begge er tall - kun eksakt match godtas (allerede sjekket ovenfor)
      continue;
    }

    // Sjekk om det er en substring match (f.eks. "hund" matcher "en hund")
    // Men ikke for tall-til-tall sammenligning
    if (!isNumericPlayerAnswer && !isNumericCorrectAnswer) {
      if (normalizedPlayerAnswer.includes(normalizedCorrect) ||
          normalizedCorrect.includes(normalizedPlayerAnswer)) {
        const substringDistance = Math.abs(normalizedPlayerAnswer.length - normalizedCorrect.length);
        if (substringDistance < bestDistance) {
          bestDistance = substringDistance;
          bestMatch = correctAnswer;
        }
        // Godkjenn substring match hvis lengdeforskjellen er liten
        if (substringDistance <= threshold) {
          return { isCorrect: true, matchedAnswer: correctAnswer, distance: substringDistance };
        }
      }
    }

    // Beregn Levenshtein-distanse (kun for tekst, ikke tall)
    if (!exactMatch && !isNumericPlayerAnswer && !isNumericCorrectAnswer) {
      const distance = levenshteinDistance(normalizedPlayerAnswer, normalizedCorrect);

      // Juster threshold basert på ordlengde (lengre ord tillater flere feil)
      const adjustedThreshold = Math.max(threshold, Math.floor(normalizedCorrect.length / 5));

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = correctAnswer;
      }

      if (distance <= adjustedThreshold) {
        return { isCorrect: true, matchedAnswer: correctAnswer, distance };
      }
    }
  }

  return { isCorrect: false, matchedAnswer: bestMatch, distance: bestDistance };
}

/**
 * Sjekker om et ord starter med riktig bokstav (for Slange-spillet)
 * @param {string} word - Ordet som skal sjekkes
 * @param {string} requiredLetter - Bokstaven ordet må starte med
 * @returns {boolean}
 */
export function startsWithLetter(word, requiredLetter) {
  if (!word || !requiredLetter) return false;
  return word.trim().toUpperCase().startsWith(requiredLetter.toUpperCase());
}

/**
 * Henter siste bokstav i et ord (for Slange-spillet)
 * @param {string} word - Ordet
 * @returns {string} - Siste bokstav i uppercase
 */
export function getLastLetter(word) {
  if (!word) return '';
  const trimmed = word.trim();
  return trimmed.charAt(trimmed.length - 1).toUpperCase();
}

export default {
  checkAnswer,
  startsWithLetter,
  getLastLetter,
  levenshteinDistance,
  normalizeString
};
