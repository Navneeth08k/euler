export type HintTier = 'nudge' | 'concept' | 'example' | 'partial' | 'solution';

export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StrokeLine {
  id: string;
  points: Point[];
  bbox: BoundingBox;
  crossedOut: boolean;
  timestamp: number;
}

export interface Hint {
  index: number;
  tier: HintTier;
  text: string;
  unlocked: boolean;
}

export interface HintLadder {
  hints: Hint[];
  currentIndex: number;
  problemId: string;
}

export type ClassificationStatus =
  | 'correct_partial'
  | 'arithmetic_error'
  | 'concept_error'
  | 'complete'
  | 'unclear';

export interface ClassificationResult {
  status: ClassificationStatus;
  errorLineIndex: number | null;
  errorType: string | null;
  confidence: number;
}

export type SessionStatus = 'idle' | 'watching' | 'classifying' | 'error_found' | 'complete';

export interface Problem {
  id: string;
  subject: 'algebra' | 'calculus' | 'geometry';
  concept: string;
  text: string;
  difficulty: 1 | 2 | 3;
}

export interface Session {
  id: string;
  problem: Problem;
  strokes: StrokeLine[];
  ladder: HintLadder | null;
  classification: ClassificationResult | null;
  status: SessionStatus;
  startedAt: number;
  hintsUsed: number;
  stepsCompleted: number;
}
