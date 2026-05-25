import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ClassificationResult,
  HintLadder,
  Problem,
  Session,
  SessionStatus,
  StrokeLine,
} from '../types';
import { classifyWithVision, getPauseDelay, shouldFlagLine } from '../services/classifier';
import { generateHintLadder } from '../services/hintLadder';

interface UseSessionReturn {
  session: Session;
  ladderReady: boolean;
  ladderProgress: number;
  flaggedLineId: string | null;
  confirmedErrorLineId: string | null;
  onStrokeComplete: (line: StrokeLine, canvasBase64: string) => void;
  onRequestHelp: () => void;
  unlockNextHint: () => void;
  resetSession: (problem: Problem) => void;
}

export function useSession(problem: Problem, apiKey: string): UseSessionReturn {
  const [session, setSession] = useState<Session>(() => ({
    id: `session_${Date.now()}`,
    problem,
    strokes: [],
    ladder: null,
    classification: null,
    status: 'idle',
    startedAt: Date.now(),
    hintsUsed: 0,
    stepsCompleted: 0,
  }));

  const [ladderReady, setLadderReady] = useState(false);
  const [ladderProgress, setLadderProgress] = useState(0);
  const [flaggedLineId, setFlaggedLineId] = useState<string | null>(null);
  const [confirmedErrorLineId, setConfirmedErrorLineId] = useState<string | null>(null);

  const classifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStrokesRef = useRef<StrokeLine[]>([]);
  const latestBase64Ref = useRef<string>('');

  useEffect(() => {
    let cancelled = false;

    generateHintLadder(problem, apiKey, (count) => {
      if (!cancelled) setLadderProgress(count);
    }).then((ladder) => {
      if (cancelled) return;
      setSession((s) => ({ ...s, ladder, status: 'watching' }));
      setLadderReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [problem.id, apiKey]);

  const runClassification = useCallback(async () => {
    const strokes = latestStrokesRef.current;
    const base64 = latestBase64Ref.current;
    if (!base64 || strokes.length === 0) return;

    setSession((s) => ({ ...s, status: 'classifying' }));

    try {
      const result = await classifyWithVision(base64, strokes, apiKey);
      handleClassificationResult(result, strokes);
    } catch {
      setSession((s) => ({ ...s, status: 'watching' }));
    }
  }, [apiKey]);

  const handleClassificationResult = useCallback(
    (result: ClassificationResult, strokes: StrokeLine[]) => {
      setSession((s) => ({ ...s, classification: result }));

      if (result.status === 'complete') {
        setSession((s) => ({ ...s, status: 'complete' }));
        setFlaggedLineId(null);
        setConfirmedErrorLineId(null);
        return;
      }

      if (
        (result.status === 'arithmetic_error' || result.status === 'concept_error') &&
        result.errorLineIndex !== null
      ) {
        const errorLine = strokes.filter((l) => !l.crossedOut)[result.errorLineIndex];
        if (errorLine) {
          setConfirmedErrorLineId(errorLine.id);
          setFlaggedLineId(null);
          setSession((s) => ({ ...s, status: 'error_found' }));
        }
        return;
      }

      if (result.status === 'correct_partial') {
        setFlaggedLineId(null);
        setConfirmedErrorLineId(null);
        setSession((s) => ({
          ...s,
          status: 'watching',
          stepsCompleted: strokes.filter((l) => !l.crossedOut).length,
        }));
        return;
      }

      setFlaggedLineId(null);
      setSession((s) => ({ ...s, status: 'watching' }));
    },
    [],
  );

  const onStrokeComplete = useCallback(
    (line: StrokeLine, canvasBase64: string) => {
      const newStrokes = [...latestStrokesRef.current, line];
      latestStrokesRef.current = newStrokes;
      latestBase64Ref.current = canvasBase64;

      setSession((s) => ({ ...s, strokes: newStrokes }));

      if (shouldFlagLine(newStrokes)) {
        setFlaggedLineId(line.id);
      }

      if (classifyTimeoutRef.current) {
        clearTimeout(classifyTimeoutRef.current);
      }
      classifyTimeoutRef.current = setTimeout(runClassification, getPauseDelay());
    },
    [runClassification],
  );

  const onRequestHelp = useCallback(() => {
    if (classifyTimeoutRef.current) {
      clearTimeout(classifyTimeoutRef.current);
    }
    runClassification();
  }, [runClassification]);

  const unlockNextHint = useCallback(() => {
    setSession((s) => {
      if (!s.ladder) return s;
      const nextIndex = s.ladder.currentIndex + 1;
      if (nextIndex >= s.ladder.hints.length) return s;

      const updatedHints = s.ladder.hints.map((h, i) =>
        i === nextIndex ? { ...h, unlocked: true } : h,
      );

      return {
        ...s,
        ladder: { ...s.ladder, hints: updatedHints, currentIndex: nextIndex },
        hintsUsed: s.hintsUsed + 1,
      };
    });
  }, []);

  const resetSession = useCallback(
    (newProblem: Problem) => {
      if (classifyTimeoutRef.current) {
        clearTimeout(classifyTimeoutRef.current);
      }
      latestStrokesRef.current = [];
      latestBase64Ref.current = '';
      setFlaggedLineId(null);
      setConfirmedErrorLineId(null);
      setLadderReady(false);
      setLadderProgress(0);
      setSession({
        id: `session_${Date.now()}`,
        problem: newProblem,
        strokes: [],
        ladder: null,
        classification: null,
        status: 'idle',
        startedAt: Date.now(),
        hintsUsed: 0,
        stepsCompleted: 0,
      });
    },
    [],
  );

  return {
    session,
    ladderReady,
    ladderProgress,
    flaggedLineId,
    confirmedErrorLineId,
    onStrokeComplete,
    onRequestHelp,
    unlockNextHint,
    resetSession,
  };
}
