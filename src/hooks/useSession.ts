import { useCallback, useEffect, useRef, useState } from 'react';
import { ClassificationResult, HintLadder, Problem, Session, StrokeLine } from '../types';
import { classifyWithVision, getPauseDelay, shouldFlagLine } from '../services/classifier';
import { generateHintLadder } from '../services/hintLadder';

interface UseSessionReturn {
  session: Session;
  ladderReady: boolean;
  ladderProgress: number;
  flaggedLineId: string | null;
  confirmedErrorLineId: string | null;
  correctLineId: string | null;
  onStrokeComplete: (line: StrokeLine, canvasBase64: string) => void;
  onRequestHelp: (freshBase64?: string) => void;
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
  const [correctLineId, setCorrectLineId] = useState<string | null>(null);

  const classifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStrokesRef = useRef<StrokeLine[]>([]);
  const latestBase64Ref = useRef<string>('');
  const classifyingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLadderReady(false);
    setLadderProgress(0);

    generateHintLadder(problem, apiKey, (count) => {
      if (!cancelled) setLadderProgress(count);
    }).then((ladder) => {
      if (cancelled) return;
      setSession((s) => ({ ...s, ladder, status: 'watching' }));
      setLadderReady(true);
    }).catch(() => {
      if (!cancelled) setSession((s) => ({ ...s, status: 'watching' }));
    });

    return () => { cancelled = true; };
  }, [problem.id, apiKey]);

  const handleClassificationResult = useCallback((result: ClassificationResult, strokes: StrokeLine[]) => {
    setSession((s) => ({ ...s, classification: result }));

    if (result.status === 'complete') {
      setSession((s) => ({ ...s, status: 'complete' }));
      setFlaggedLineId(null);
      setConfirmedErrorLineId(null);
      return;
    }

    if ((result.status === 'arithmetic_error' || result.status === 'concept_error') && result.errorLineIndex !== null) {
      const activeLines = strokes.filter((l) => !l.crossedOut);
      const errorLine = activeLines[result.errorLineIndex];
      if (errorLine) {
        setConfirmedErrorLineId(errorLine.id);
        setCorrectLineId(null);
        setFlaggedLineId(null);
        setSession((s) => ({ ...s, status: 'error_found' }));
        return;
      }
    }

    if (result.status === 'correct_partial') {
      const activeLines = strokes.filter((l) => !l.crossedOut);
      const lastLine = activeLines[activeLines.length - 1];
      if (lastLine) {
        setCorrectLineId(lastLine.id);
        setTimeout(() => setCorrectLineId(null), 1500);
      }
      setFlaggedLineId(null);
      setConfirmedErrorLineId(null);
      setSession((s) => ({
        ...s,
        status: 'watching',
        stepsCompleted: activeLines.length,
      }));
      return;
    }

    setFlaggedLineId(null);
    setSession((s) => ({ ...s, status: 'watching' }));
  }, []);

  const runClassification = useCallback(async () => {
    if (classifyingRef.current) return;
    const strokes = latestStrokesRef.current;
    const base64 = latestBase64Ref.current;
    if (strokes.length === 0) return;

    classifyingRef.current = true;
    setSession((s) => ({ ...s, status: 'classifying' }));

    try {
      const result = await classifyWithVision(base64, strokes, apiKey);
      handleClassificationResult(result, strokes);
    } catch {
      setSession((s) => ({ ...s, status: 'watching' }));
    } finally {
      classifyingRef.current = false;
    }
  }, [apiKey, handleClassificationResult]);

  const onStrokeComplete = useCallback((line: StrokeLine, canvasBase64: string) => {
    const newStrokes = [...latestStrokesRef.current, line];
    latestStrokesRef.current = newStrokes;
    if (canvasBase64) latestBase64Ref.current = canvasBase64;

    setSession((s) => ({ ...s, strokes: newStrokes }));

    if (shouldFlagLine(newStrokes)) setFlaggedLineId(line.id);

    if (classifyTimeoutRef.current) clearTimeout(classifyTimeoutRef.current);
    classifyTimeoutRef.current = setTimeout(runClassification, getPauseDelay());
  }, [runClassification]);

  const onRequestHelp = useCallback((freshBase64?: string) => {
    if (classifyTimeoutRef.current) clearTimeout(classifyTimeoutRef.current);
    // If a fresh capture was provided, update the ref so classifier sees it
    if (freshBase64) latestBase64Ref.current = freshBase64;
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

  const resetSession = useCallback((newProblem: Problem) => {
    if (classifyTimeoutRef.current) clearTimeout(classifyTimeoutRef.current);
    latestStrokesRef.current = [];
    latestBase64Ref.current = '';
    classifyingRef.current = false;
    setFlaggedLineId(null);
    setConfirmedErrorLineId(null);
    setCorrectLineId(null);
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
  }, []);

  return {
    session, ladderReady, ladderProgress,
    flaggedLineId, confirmedErrorLineId, correctLineId,
    onStrokeComplete, onRequestHelp, unlockNextHint, resetSession,
  };
}
