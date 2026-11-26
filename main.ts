// The Internet in One Word — entry program (program/v1).
// Writes exactly one word describing the whole internet to
// /output/entry.txt.
//
// How the word was picked: every candidate is scored 0-5 on the four
// qualities the judge's brief weighs, in the brief's own order — funny
// first, then true about the internet as a whole, then surprising, then
// lands in one beat. The weights follow that order (0.4 / 0.3 / 0.2 /
// 0.1). One more term is subtracted: how common the word is expected to
// be in the field (0 = nobody sends it, 1 = every other entrant does),
// times 0.5. Byte-identical entries share one rate and the earlier
// receipt places above the copies, so a word half the field sends is a
// bad bet even before the judge reads it. The program picks the highest
// total, breaking an exact tie toward the shorter word, because the
// rules break exact ties toward the smaller text.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type Scores = { funny: number; fits: number; surprising: number; lands: number };

const WEIGHTS: Scores = { funny: 0.4, fits: 0.3, surprising: 0.2, lands: 0.1 };
const COMMONNESS_PENALTY = 0.5;

// Candidates, scored honestly against the brief. Notes:
// - "Feral" is the pick. The internet was built to be domesticated —
//   a tool for knowledge, commerce, connection — and it went wild.
//   Feral is precisely that: a domesticated thing returned to the
//   wild. It covers everything at once (the memes, the rage, the
//   scams, the genius, the kindness) in one untamed beast, and the
//   animal metaphor on a network is the laugh: you laugh, then nod.
//   Five letters, one beat, and nobody's first reach for the internet.
// - "Unhinged" is the stock phrase ("the internet is unhinged"):
//   funny and true, but it IS the first obvious word, so it loses on
//   surprise — and half the field will send it.
// - "Madhouse" is vivid and funny, but two beats where one would do,
//   and a well-worn metaphor.
// - "Brainrot" is internet-native and funny, but it names a mood and
//   an era of content, not the whole internet.
// - "Slop" is punchy and current, but it names low-quality AI content
//   only — a corner of the internet, not the whole of it.
// - "Lawless" is true and surprising, but the laugh is thin: a
//   description, not a joke.
// - "Deranged" is "Unhinged" with a thesaurus — same joke, less punch.
// - "Circus" is vivid but a cliché ("it's a circus out there").
// - "Doomscrolling" is an activity, not a description of the whole,
//   and 13 letters lands slow.
// - "Loading" is the eternal state of the internet and mildly funny,
//   but the laugh is a shrug, not a joke.
// - "Chaos" is the first word anyone reaches for: true, not funny,
//   not surprising — the definition of a bad bet.
// - "Everything" is true and nothing else: no laugh, no surprise.
const CANDIDATES: Array<{ word: string; scores: Scores; common: number }> = [
  { word: "Feral", scores: { funny: 5, fits: 5, surprising: 4, lands: 5 }, common: 0.2 },
  { word: "Unhinged", scores: { funny: 4, fits: 5, surprising: 2, lands: 4 }, common: 0.9 },
  { word: "Madhouse", scores: { funny: 4, fits: 4, surprising: 3, lands: 3 }, common: 0.5 },
  { word: "Brainrot", scores: { funny: 4, fits: 3, surprising: 3, lands: 4 }, common: 0.5 },
  { word: "Slop", scores: { funny: 4, fits: 2, surprising: 4, lands: 5 }, common: 0.4 },
  { word: "Lawless", scores: { funny: 3, fits: 4, surprising: 3, lands: 4 }, common: 0.4 },
  { word: "Deranged", scores: { funny: 3, fits: 4, surprising: 3, lands: 3 }, common: 0.5 },
  { word: "Circus", scores: { funny: 3, fits: 4, surprising: 2, lands: 4 }, common: 0.6 },
  { word: "Doomscrolling", scores: { funny: 3, fits: 3, surprising: 2, lands: 2 }, common: 0.7 },
  { word: "Loading", scores: { funny: 2, fits: 3, surprising: 3, lands: 4 }, common: 0.3 },
  { word: "Chaos", scores: { funny: 2, fits: 4, surprising: 1, lands: 5 }, common: 0.95 },
  { word: "Everything", scores: { funny: 1, fits: 4, surprising: 2, lands: 3 }, common: 0.8 },
];

function total(c: { scores: Scores; common: number }): number {
  const s = c.scores;
  return (
    s.funny * WEIGHTS.funny +
    s.fits * WEIGHTS.fits +
    s.surprising * WEIGHTS.surprising +
    s.lands * WEIGHTS.lands -
    c.common * COMMONNESS_PENALTY
  );
}

const ranked = [...CANDIDATES]
  .map((c) => ({ word: c.word, total: total(c) }))
  .sort((a, b) => b.total - a.total || a.word.length - b.word.length);

// Head-to-head, the final: "Feral" (4.70) beats "Unhinged" (3.45) by
// more than a point. Unhinged fits just as well, but the brief weighs
// funny before fitting and surprise right after, and Feral wins both:
// the wild-animal picture is the sharper joke, and it is the word
// nobody reaches for first. "Feral" it is.
for (const r of ranked) console.log(`${r.word}: ${r.total.toFixed(2)}`);

const WORD = ranked[0].word;

// The sealed gate only accepts UTF-8 text of 1 to 30 characters that is
// not only whitespace, and the judge only rewards a single word. Refuse
// to write anything that would fail it, instead of shipping a bad entry.
if (
  WORD.length < 1 ||
  WORD.length > 30 ||
  WORD.trim().length === 0 ||
  /\s/.test(WORD)
) {
  throw new Error(`Word fails the gate: ${JSON.stringify(WORD)}`);
}

// The harness runs the program in a sandbox where /output exists.
// OUTPUT_PATH is an override for local runs only; the default is the
// path the competition names. Only the file is written — never touch
// the output directory itself.
const outPath = process.env.OUTPUT_PATH ?? "/output/entry.txt";
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, WORD, "utf8");

// Read the file back and confirm it holds exactly the word: the gate
// counts bytes, so a stray newline or encoding slip here would be the
// whole entry. Fail loudly locally rather than ship it wrong.
const written = readFileSync(outPath, "utf8");
if (written !== WORD) {
  throw new Error(`wrote ${JSON.stringify(written)}, expected ${JSON.stringify(WORD)}`);
}
