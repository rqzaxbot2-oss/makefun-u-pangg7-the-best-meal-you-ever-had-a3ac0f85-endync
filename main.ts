import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const MAX_CHARACTERS = 200;
const OUTPUT_FILENAME = "output.txt";
const DEFAULT_OUTPUT_SUBDIR = "out";
const CONTROL_OR_LINE_BREAK_PATTERN = /[\u0000-\u001F\u007F\u0085\u2028\u2029]/;

const ENTRY_SENTENCE =
  "The night my grandfather forgot my name, we ate day-old rice fried in bacon fat with browned garlic and scallions off chipped blue plates, and he still scraped the crispy pan crust onto mine.";

function validateSentence(input: string): string {
  const sentence = input.trim();

  if (sentence.length === 0) {
    throw new Error("Entry sentence must not be empty.");
  }

  if (CONTROL_OR_LINE_BREAK_PATTERN.test(sentence)) {
    throw new Error("Entry sentence must be a single line without control characters.");
  }

  if (/\s{2,}/.test(sentence)) {
    throw new Error("Entry sentence must not contain consecutive whitespace.");
  }

  const codePointLength = [...sentence].length;
  if (sentence.length > MAX_CHARACTERS || codePointLength > MAX_CHARACTERS) {
    throw new Error(
      `Entry sentence exceeds ${MAX_CHARACTERS} characters (got ${Math.max(sentence.length, codePointLength)}).`,
    );
  }

  if (!/[.!?]$/.test(sentence)) {
    throw new Error("Entry sentence must end with terminal punctuation.");
  }

  const bodyWithoutTerminal = sentence.slice(0, -1);
  if (/[.!?](?:\s|$)/.test(bodyWithoutTerminal)) {
    throw new Error("Entry must contain exactly one standalone sentence.");
  }

  return sentence;
}

function resolveOutputDirectory(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.MAKEFUN_OUTPUT_DIR;
  if (raw === undefined) {
    return resolve(process.cwd(), DEFAULT_OUTPUT_SUBDIR);
  }

  const configured = raw.trim();
  if (configured.length === 0) {
    return resolve(process.cwd(), DEFAULT_OUTPUT_SUBDIR);
  }

  if (configured.includes("\0")) {
    throw new Error("MAKEFUN_OUTPUT_DIR must not contain null bytes.");
  }

  return resolve(configured);
}

function ensureOutputDirectory(outputDir: string): void {
  const existing = statSync(outputDir, { throwIfNoEntry: false });
  if (existing !== undefined) {
    if (!existing.isDirectory()) {
      throw new Error(`Output path exists and is not a directory: ${outputDir}`);
    }
    return;
  }

  mkdirSync(outputDir, { recursive: true });
}

function writeOutputFile(outputDir: string, payload: string): void {
  const outputPath = join(outputDir, OUTPUT_FILENAME);
  const existingTarget = statSync(outputPath, { throwIfNoEntry: false });
  if (existingTarget?.isDirectory()) {
    throw new Error(`Output file path is an existing directory: ${outputPath}`);
  }

  writeFileSync(outputPath, payload, { encoding: "utf8", flag: "w" });
}

function run(): void {
  const sentence = validateSentence(ENTRY_SENTENCE);
  const outputDir = resolveOutputDirectory();
  ensureOutputDirectory(outputDir);

  const payload = `${sentence}\n`;
  writeOutputFile(outputDir, payload);
  process.stdout.write(payload);
}

try {
  run();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
}