import { GoogleGenAI } from '@google/genai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hint, HintLadder, HintTier, Problem } from '../types';

const HINT_COUNT = 25;
const MODEL = 'gemini-3.5-flash';

const TIER_CONFIG: { range: [number, number]; tier: HintTier; instruction: string }[] = [
  {
    range: [0, 4],
    tier: 'nudge',
    instruction: 'Give a directional nudge with no math. Ask one short question pointing the student toward the right approach without naming it.',
  },
  {
    range: [5, 9],
    tier: 'concept',
    instruction: 'Name the relevant mathematical rule or concept. Ask the student to state it in their own words.',
  },
  {
    range: [10, 15],
    tier: 'example',
    instruction: 'Show a fully worked parallel example using different numbers but the same method. Do NOT use the numbers from the original problem.',
  },
  {
    range: [16, 23],
    tier: 'partial',
    instruction: 'Show the first steps of the actual solution, then stop. Leave the remaining steps for the student.',
  },
  {
    range: [24, 24],
    tier: 'solution',
    instruction: 'Provide the complete worked solution with every step clearly shown.',
  },
];

function getTierForIndex(index: number): { tier: HintTier; instruction: string } {
  for (const config of TIER_CONFIG) {
    if (index >= config.range[0] && index <= config.range[1]) {
      return { tier: config.tier, instruction: config.instruction };
    }
  }
  return { tier: 'nudge', instruction: TIER_CONFIG[0].instruction };
}

function storageKey(problemId: string): string {
  return `euler_hints_v3_${problemId}`;
}

export async function getCachedLadder(problemId: string): Promise<HintLadder | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(problemId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HintLadder;
    if (parsed.hints.length !== HINT_COUNT) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function generateOneHint(
  ai: GoogleGenAI,
  index: number,
  problem: Problem,
  previousHints: Hint[],
): Promise<string> {
  const { tier, instruction } = getTierForIndex(index);
  const prevText = previousHints.map((h) => `Hint ${h.index + 1}: ${h.text}`).join('\n');

  const systemInstruction = [
    `You are Euler, a warm math tutor. Generate hint ${index + 1} of 25 for this problem.`,
    `Tier: ${tier} — ${instruction}`,
    'Rules: never reveal the answer before hint 25. Each hint must be slightly more revealing than the last.',
    'Never say "just" or "simply". Be encouraging. Return ONLY the hint text, nothing else.',
  ].join('\n');

  const userContent = [
    `Problem: ${problem.text}`,
    `Subject: ${problem.subject} — ${problem.concept}`,
    prevText ? `\nPrevious hints:\n${prevText}` : '',
  ].join('\n');

  const response = await ai.models.generateContent({
    model: MODEL,
    config: { systemInstruction, maxOutputTokens: 350 },
    contents: userContent,
  });

  return (response.text ?? '').trim();
}

export async function generateHintLadder(
  problem: Problem,
  apiKey: string,
  onProgress?: (generated: number) => void,
): Promise<HintLadder> {
  const cached = await getCachedLadder(problem.id);
  if (cached) {
    onProgress?.(HINT_COUNT);
    return cached;
  }

  const ai = new GoogleGenAI({ apiKey });
  const hints: Hint[] = [];

  for (let i = 0; i < HINT_COUNT; i++) {
    const { tier } = getTierForIndex(i);
    let text = '';

    // 2 attempts per hint before giving up and using a fallback
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        text = await generateOneHint(ai, i, problem, hints);
        if (text) break;
      } catch {
        if (attempt === 1) {
          text = 'Think carefully about the next step.';
        }
      }
    }

    hints.push({ index: i, tier, text: text || 'Consider what you know about this type of problem.', unlocked: false });
    onProgress?.(i + 1);
  }

  const ladder: HintLadder = { hints, currentIndex: -1, problemId: problem.id };

  try {
    await AsyncStorage.setItem(storageKey(problem.id), JSON.stringify(ladder));
  } catch {
    // Cache failure is non-fatal
  }

  return ladder;
}
