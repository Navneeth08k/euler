import { GoogleGenAI } from '@google/genai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hint, HintLadder, HintTier, Problem } from '../types';

const HINT_COUNT = 25;
const MODEL = 'gemini-2.5-flash';

const TIER_CONFIG: { range: [number, number]; tier: HintTier; instruction: string }[] = [
  {
    range: [0, 4],
    tier: 'nudge',
    instruction:
      'Give a directional nudge with no math. Ask a question that points the student toward the right approach without naming it.',
  },
  {
    range: [5, 9],
    tier: 'concept',
    instruction:
      'Name the relevant mathematical rule or concept. Ask the student to state it in their own words.',
  },
  {
    range: [10, 15],
    tier: 'example',
    instruction:
      'Show a fully worked parallel example using different numbers but the same method. Do NOT use the numbers from the original problem.',
  },
  {
    range: [16, 23],
    tier: 'partial',
    instruction:
      'Show the first steps of the actual solution. Leave the remaining steps for the student to complete.',
  },
  {
    range: [24, 24],
    tier: 'solution',
    instruction: 'Provide the complete worked solution with every step shown.',
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
  return `euler_hints_${problemId}`;
}

export async function getCachedLadder(problemId: string): Promise<HintLadder | null> {
  const raw = await AsyncStorage.getItem(storageKey(problemId));
  if (!raw) return null;
  return JSON.parse(raw) as HintLadder;
}

async function cacheLadder(ladder: HintLadder): Promise<void> {
  await AsyncStorage.setItem(storageKey(ladder.problemId), JSON.stringify(ladder));
}

export async function generateHintLadder(
  problem: Problem,
  apiKey: string,
  onProgress?: (generated: number) => void,
): Promise<HintLadder> {
  const cached = await getCachedLadder(problem.id);
  if (cached && cached.hints.length === HINT_COUNT) {
    return cached;
  }

  const ai = new GoogleGenAI({ apiKey });
  const hints: Hint[] = [];

  for (let i = 0; i < HINT_COUNT; i++) {
    const { tier, instruction } = getTierForIndex(i);
    const previousHints = hints.map((h) => `Hint ${h.index + 1}: ${h.text}`).join('\n');

    const systemInstruction = [
      `You are Euler, a math tutor generating hint ${i + 1} of 25.`,
      `Tier: ${tier} — ${instruction}`,
      'Rules:',
      '- Never give away the answer before hint 25',
      '- Each hint must be slightly more revealing than the last',
      '- Be warm and encouraging, never condescending',
      '- Return ONLY the hint text, no preamble',
    ].join('\n');

    const userPrompt = [
      `Problem: ${problem.text}`,
      `Subject: ${problem.subject}`,
      `Concept: ${problem.concept}`,
      previousHints ? `\nPrevious hints given:\n${previousHints}` : '',
    ].join('\n');

    const response = await ai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction,
        maxOutputTokens: 150,
      },
      contents: userPrompt,
    });

    const text = response.text ?? '';

    hints.push({
      index: i,
      tier,
      text: text.trim(),
      unlocked: false,
    });

    onProgress?.(i + 1);
  }

  const ladder: HintLadder = {
    hints,
    currentIndex: -1,
    problemId: problem.id,
  };

  await cacheLadder(ladder);
  return ladder;
}
