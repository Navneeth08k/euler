import { GoogleGenAI } from '@google/genai';
import { ClassificationResult, StrokeLine } from '../types';

const SUSPICION_THRESHOLD = 0.35;
const CONFIDENCE_THRESHOLD = 0.75;
const PAUSE_DELAY_MS = 1800;
const MODEL = 'gemini-2.5-flash';

export function computeSuspicionScore(lines: StrokeLine[]): number {
  if (lines.length === 0) return 0;

  let score = 0;
  const latestLine = lines[lines.length - 1];

  const crossedOutCount = lines.filter((l) => l.crossedOut).length;
  if (crossedOutCount > 0) {
    score += Math.min(crossedOutCount * 0.15, 0.4);
  }

  if (latestLine.points.length > 2) {
    const duration =
      latestLine.points[latestLine.points.length - 1].timestamp -
      latestLine.points[0].timestamp;
    const length = latestLine.bbox.width + latestLine.bbox.height;
    if (duration > 0 && length / duration > 2) {
      score += 0.1;
    }
  }

  if (lines.length >= 2) {
    const prev = lines[lines.length - 2];
    const timeBetween = latestLine.timestamp - prev.timestamp;
    if (timeBetween < 500 && Math.abs(latestLine.bbox.y - prev.bbox.y) < 30) {
      score += 0.15;
    }
  }

  const shortStrokes = latestLine.points.length < 4;
  if (shortStrokes && latestLine.bbox.width > latestLine.bbox.height * 3) {
    score += 0.1;
  }

  return Math.min(score, 1);
}

export function shouldFlagLine(lines: StrokeLine[]): boolean {
  return computeSuspicionScore(lines) > SUSPICION_THRESHOLD;
}

export function getPauseDelay(): number {
  return PAUSE_DELAY_MS;
}

export async function classifyWithVision(
  imageBase64: string,
  lines: StrokeLine[],
  apiKey: string,
): Promise<ClassificationResult> {
  const ai = new GoogleGenAI({ apiKey });

  const activeLines = lines.filter((l) => !l.crossedOut);
  const lineDescriptions = activeLines
    .map(
      (l, i) =>
        `Line ${i + 1}: bbox(${Math.round(l.bbox.x)}, ${Math.round(l.bbox.y)}, ${Math.round(l.bbox.width)}, ${Math.round(l.bbox.height)})`,
    )
    .join('\n');

  const systemInstruction = [
    "You are Euler's error detection engine. Analyze student handwritten math work.",
    'Return ONLY valid JSON with no markdown fences:',
    '{',
    '  "status": "correct_partial" | "arithmetic_error" | "concept_error" | "complete" | "unclear",',
    '  "errorLineIndex": number | null,',
    '  "errorType": string | null,',
    '  "confidence": number',
    '}',
    'Rules:',
    '- If confidence < 0.75, return status "unclear"',
    '- Ignore crossed-out work entirely',
    '- errorType: be specific ("forgot second product rule term", etc.)',
    '- "complete" only when final answer is fully correct',
  ].join('\n');

  const response = await ai.models.generateContent({
    model: MODEL,
    config: {
      systemInstruction,
      maxOutputTokens: 200,
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64,
            },
          },
          {
            text: `Active stroke lines:\n${lineDescriptions}\n\nAnalyze the student's work and return the classification JSON.`,
          },
        ],
      },
    ],
  });

  const text = response.text ?? '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { status: 'unclear', errorLineIndex: null, errorType: null, confidence: 0 };
  }

  const parsed = JSON.parse(jsonMatch[0]) as ClassificationResult;

  if (parsed.confidence < CONFIDENCE_THRESHOLD) {
    return { ...parsed, status: 'unclear' };
  }

  return parsed;
}
