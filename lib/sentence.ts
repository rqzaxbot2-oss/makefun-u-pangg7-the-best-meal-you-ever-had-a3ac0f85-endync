export const MAX_LENGTH = 200;
export const MAX_SENTENCE_LENGTH = MAX_LENGTH;
export const MAX_CHARS = MAX_LENGTH;
export const MIN_WORDS = 5;

export const BEST_MEAL_SENTENCE =
  "Still in our coats after my father's surgery, we stood over my aunt's hissing pan of crispy garlic rice and runny fried eggs, eating straight from the cast iron until our hands stopped shaking.";

export const MEAL_SENTENCE = BEST_MEAL_SENTENCE;
export const SENTENCE = BEST_MEAL_SENTENCE;

export const CANDIDATE_SENTENCES: readonly string[] = [
  BEST_MEAL_SENTENCE,
  "On a rain-slick pier in Vigo, my grandfather cracked salt-crusted percebes with his thumbnail and handed me the briny meat while diesel smoke drifted off the morning trawlers.",
  "After our ferry broke down outside Messina, a baker tore open a blistered sesame loaf still steaming from the oven and stuffed it with cold ricotta and cracked black pepper.",
];

export const CANDIDATES = CANDIDATE_SENTENCES;

export interface ValidationResult {
  valid: boolean;
  ok: boolean;
  sentence: string;
  length: number;
  charCount: number;
  chars: number;
  maxLength: number;
  wordCount: number;
  sentenceCount: number;
  errors: string[];
}

export type SentenceValidation = ValidationResult;

export interface ConcretenessBreakdown {
  sensory: number;
  personal: number;
  specificity: number;
  memorability: number;
  conciseness: number;
  clichePenalty: number;
}

export interface MatchedSignals {
  sensory: string[];
  personal: string[];
  specificity: string[];
  memorability: string[];
  cliches: string[];
}

export interface ConcretenessScore {
  total: number;
  score: number;
  sensory: number;
  personal: number;
  specificity: number;
  memorability: number;
  conciseness: number;
  clichePenalty: number;
  breakdown: ConcretenessBreakdown;
  matchedSignals: MatchedSignals;
  signals: string[];
  wordCount: number;
  charCount: number;
}

export type SentenceScore = ConcretenessScore;

export interface RankedSentence {
  sentence: string;
  validation: ValidationResult;
  score: ConcretenessScore;
}

const SENSORY_TERMS: readonly string[] = [
  "hissing",
  "sizzling",
  "crispy",
  "crunchy",
  "garlic",
  "runny",
  "fried",
  "charred",
  "scorched",
  "blistered",
  "steaming",
  "briny",
  "salt",
  "smoke",
  "smoky",
  "pepper",
  "black pepper",
  "cold",
  "hot",
  "warm",
  "sour",
  "bitter",
  "spicy",
  "toasted",
  "saffron",
  "rain",
  "slick",
];

const PERSONAL_TERMS: readonly string[] = [
  "i",
  "me",
  "my",
  "we",
  "us",
  "our",
  "father",
  "mother",
  "aunt",
  "uncle",
  "grandfather",
  "grandmother",
  "sister",
  "brother",
  "friend",
  "hands",
  "his",
  "her",
  "baker",
];

const SPECIFICITY_TERMS: readonly string[] = [
  "coats",
  "surgery",
  "pan",
  "skillet",
  "pot",
  "cast iron",
  "rice",
  "eggs",
  "pier",
  "vigo",
  "percebes",
  "thumbnail",
  "meat",
  "diesel",
  "trawlers",
  "ferry",
  "messina",
  "sesame",
  "loaf",
  "oven",
  "ricotta",
  "table",
  "kitchen",
  "spoons",
  "bowls",
];

const MEMORABILITY_TERMS: readonly string[] = [
  "still",
  "after",
  "stood",
  "straight",
  "until",
  "stopped",
  "shaking",
  "cracked",
  "handed",
  "drifted",
  "morning",
  "broke",
  "tore",
  "stuffed",
  "slid",
  "pried",
];

const CLICHE_TERMS: readonly string[] = [
  "delicious",
  "amazing",
  "incredible",
  "yummy",
  "tasty",
  "mouthwatering",
  "best meal",
  "flavor explosion",
  "melted in my mouth",
  "to die for",
];

export function countChars(text: string): number {
  return [...text].length;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  const segments = trimmed
    .split(/[.!?]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  return segments.length;
}

export function validateSentence(
  text: string,
  maxLength: number = MAX_LENGTH,
): ValidationResult {
  const errors: string[] = [];
  const charCount = countChars(text);
  const codeUnitLength = text.length;
  const effectiveLength = Math.max(charCount, codeUnitLength);
  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);

  if (text.length === 0) {
    errors.push("Sentence must not be empty.");
  }

  if (text !== text.trim()) {
    errors.push("Sentence must not have leading or trailing whitespace.");
  }

  if (/[\r\n\t]/.test(text)) {
    errors.push("Sentence must be a single line without newlines or tabs.");
  }

  if (effectiveLength > maxLength) {
    errors.push(
      `Sentence exceeds maximum length of ${maxLength} characters (got ${effectiveLength}).`,
    );
  }

  if (wordCount < MIN_WORDS) {
    errors.push(
      `Sentence must contain at least ${MIN_WORDS} words (got ${wordCount}).`,
    );
  }

  if (text.length > 0 && !/^[A-Z]/.test(text)) {
    errors.push("Sentence must start with an uppercase ASCII letter.");
  }

  if (text.length > 0 && !/[.!?]$/.test(text)) {
    errors.push("Sentence must end with terminal punctuation (., !, or ?).");
  }

  if (/^(?:#{1,6}\s|[-*•]\s|\d+[.)]\s)/.test(text)) {
    errors.push("Sentence must not start with a heading or list prefix.");
  }

  if (/<[a-zA-Z!/]/.test(text)) {
    errors.push("Sentence must be plain text without HTML markup.");
  }

  if (text.length > 1) {
    const interior = text.slice(0, -1);
    if (/[.!?]/.test(interior)) {
      errors.push("Sentence must contain exactly one sentence with no internal terminal punctuation.");
    }
    if (/[;:]/.test(interior)) {
      errors.push("Sentence must not use colons or semicolons to bolt on titles, lists, or extra clauses.");
    }
  }

  if (sentenceCount !== 1) {
    errors.push(`Sentence must resolve to exactly 1 sentence (got ${sentenceCount}).`);
  }

  const valid = errors.length === 0;
  return {
    valid,
    ok: valid,
    sentence: text,
    length: effectiveLength,
    charCount,
    chars: effectiveLength,
    maxLength,
    wordCount,
    sentenceCount,
    errors,
  };
}

export function isValidSentence(
  text: string,
  maxLength: number = MAX_LENGTH,
): boolean {
  return validateSentence(text, maxLength).valid;
}

export function assertValidSentence(
  text: string,
  maxLength: number = MAX_LENGTH,
): string {
  const result = validateSentence(text, maxLength);
  if (!result.valid) {
    throw new Error(`Invalid meal sentence: ${result.errors.join(" ")}`);
  }
  return text;
}

function normalizeForMatching(text: string): {
  padded: string;
  tokenSet: Set<string>;
} {
  const cleaned = text
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
  const tokens = cleaned.length > 0 ? cleaned.split(/\s+/) : [];
  return {
    padded: ` ${cleaned} `,
    tokenSet: new Set(tokens),
  };
}

function findLexiconMatches(
  normalized: { padded: string; tokenSet: Set<string> },
  lexicon: readonly string[],
): string[] {
  const matched: string[] = [];
  for (const term of lexicon) {
    if (term.includes(" ")) {
      if (normalized.padded.includes(` ${term} `)) {
        matched.push(term);
      }
    } else if (normalized.tokenSet.has(term)) {
      matched.push(term);
    }
  }
  return matched;
}

function scoreConciseness(charCount: number, maxLength: number): number {
  if (charCount === 0 || charCount > maxLength) {
    return 0;
  }
  if (charCount >= 120 && charCount <= maxLength) {
    return 10;
  }
  if (charCount >= 80) {
    return 7;
  }
  if (charCount >= 40) {
    return 4;
  }
  return 2;
}

export function scoreConcreteness(text: string): ConcretenessScore {
  const charCount = countChars(text);
  const wordCount = countWords(text);
  const normalized = normalizeForMatching(text);

  const sensoryMatches = findLexiconMatches(normalized, SENSORY_TERMS);
  const personalMatches = findLexiconMatches(normalized, PERSONAL_TERMS);
  const specificityMatches = findLexiconMatches(normalized, SPECIFICITY_TERMS);
  const memorabilityMatches = findLexiconMatches(normalized, MEMORABILITY_TERMS);
  const clicheMatches = findLexiconMatches(normalized, CLICHE_TERMS);

  const sensory = Math.min(28, sensoryMatches.length * 6);
  const personal = Math.min(24, personalMatches.length * 4);
  const specificity = Math.min(24, specificityMatches.length * 4);
  const memorability = Math.min(14, memorabilityMatches.length * 3);
  const conciseness = scoreConciseness(charCount, MAX_LENGTH);
  const clichePenalty = Math.min(20, clicheMatches.length * 5);

  const rawTotal =
    sensory + personal + specificity + memorability + conciseness - clichePenalty;
  const total = Math.max(0, Math.min(100, rawTotal));

  const breakdown: ConcretenessBreakdown = {
    sensory,
    personal,
    specificity,
    memorability,
    conciseness,
    clichePenalty,
  };

  const matchedSignals: MatchedSignals = {
    sensory: sensoryMatches,
    personal: personalMatches,
    specificity: specificityMatches,
    memorability: memorabilityMatches,
    cliches: clicheMatches,
  };

  const signals = Array.from(
    new Set([
      ...sensoryMatches,
      ...personalMatches,
      ...specificityMatches,
      ...memorabilityMatches,
    ]),
  );

  return {
    total,
    score: total,
    sensory,
    personal,
    specificity,
    memorability,
    conciseness,
    clichePenalty,
    breakdown,
    matchedSignals,
    signals,
    wordCount,
    charCount,
  };
}

export const scoreSentence = scoreConcreteness;

export function rankSentences(
  sentences: readonly string[] = CANDIDATE_SENTENCES,
): RankedSentence[] {
  const evaluated: RankedSentence[] = sentences.map((sentence) => ({
    sentence,
    validation: validateSentence(sentence),
    score: scoreConcreteness(sentence),
  }));

  return evaluated.sort((a, b) => {
    if (a.validation.valid !== b.validation.valid) {
      return a.validation.valid ? -1 : 1;
    }
    if (b.score.total !== a.score.total) {
      return b.score.total - a.score.total;
    }
    if (a.validation.length !== b.validation.length) {
      return a.validation.length - b.validation.length;
    }
    return a.sentence.localeCompare(b.sentence, "en");
  });
}

export function selectBestSentence(
  sentences: readonly string[] = CANDIDATE_SENTENCES,
): RankedSentence {
  const ranked = rankSentences(sentences);
  const top = ranked[0];
  if (!top || !top.validation.valid) {
    throw new Error("No valid meal sentence candidate available.");
  }
  return top;
}

export function getBestMealSentence(): string {
  return assertValidSentence(BEST_MEAL_SENTENCE);
}

export const getMealSentence = getBestMealSentence;
export const getSentence = getBestMealSentence;

export default {
  MAX_LENGTH,
  MAX_SENTENCE_LENGTH,
  MAX_CHARS,
  MIN_WORDS,
  BEST_MEAL_SENTENCE,
  MEAL_SENTENCE,
  SENTENCE,
  CANDIDATE_SENTENCES,
  CANDIDATES,
  countChars,
  countWords,
  countSentences,
  validateSentence,
  isValidSentence,
  assertValidSentence,
  scoreConcreteness,
  scoreSentence,
  rankSentences,
  selectBestSentence,
  getBestMealSentence,
  getMealSentence,
  getSentence,
};