import * as FileSystem from 'expo-file-system';
import React, { useCallback, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { UNDERLINE_COLORS } from '../constants/colors';
import { BoundingBox, Point, StrokeLine } from '../types';

interface EulerCanvasProps {
  flaggedLineId: string | null;
  confirmedErrorLineId: string | null;
  correctLineId: string | null;
  onStrokeComplete: (line: StrokeLine, canvasBase64: string) => void;
}

const LINE_CLUSTER_THRESHOLD = 30;

function generateId(): string {
  return `line_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function computeBBox(points: Point[]): BoundingBox {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function isCrossOutGesture(bbox: BoundingBox, pointCount: number): boolean {
  return pointCount >= 3 && bbox.width > bbox.height * 3 && bbox.height < 25;
}

function pointsToSvgPath(points: Point[]): string {
  if (points.length < 2) return '';
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(' ');
}

function clusterIntoExistingLine(points: Point[], existingLines: StrokeLine[]): string | null {
  if (points.length === 0) return null;
  const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  for (const line of existingLines) {
    const lineAvgY = line.points.reduce((sum, p) => sum + p.y, 0) / line.points.length;
    if (Math.abs(avgY - lineAvgY) < LINE_CLUSTER_THRESHOLD) return line.id;
  }
  return null;
}

interface Stroke {
  id: string;
  points: Point[];
  crossedOut: boolean;
}

export function EulerCanvas({ flaggedLineId, confirmedErrorLineId, correctLineId, onStrokeComplete }: EulerCanvasProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [lines, setLines] = useState<StrokeLine[]>([]);
  const linesRef = useRef<StrokeLine[]>([]);
  const activePointsRef = useRef<Point[]>([]);
  const viewShotRef = useRef<ViewShot>(null);
  const captureScheduled = useRef(false);

  const captureCanvas = useCallback(async (): Promise<string> => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) return '';
      // expo-file-system reads file:// URIs as base64 on device
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as const,
      });
      return base64;
    } catch {
      return '';
    }
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      activePointsRef.current = [{ x: locationX, y: locationY, timestamp: Date.now() }];
    },

    onPanResponderMove: (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      activePointsRef.current.push({ x: locationX, y: locationY, timestamp: Date.now() });
      setStrokes((prev) => [
        ...prev.filter((s) => s.id !== 'active'),
        { id: 'active', points: [...activePointsRef.current], crossedOut: false },
      ]);
    },

    onPanResponderRelease: async () => {
      const pts = activePointsRef.current;
      activePointsRef.current = [];
      if (pts.length < 2) {
        setStrokes((prev) => prev.filter((s) => s.id !== 'active'));
        return;
      }

      const bbox = computeBBox(pts);
      const crossedOut = isCrossOutGesture(bbox, pts.length);
      const strokeId = generateId();
      const existingLineId = clusterIntoExistingLine(pts, linesRef.current);
      const lineId = existingLineId ?? generateId();

      const newStroke: Stroke = { id: strokeId, points: pts, crossedOut };
      setStrokes((prev) => [...prev.filter((s) => s.id !== 'active'), newStroke]);

      const newLine: StrokeLine = { id: lineId, points: pts, bbox, crossedOut, timestamp: Date.now() };
      const updatedLines = existingLineId
        ? linesRef.current.map((l) =>
            l.id === existingLineId
              ? { ...l, points: [...l.points, ...pts], bbox: computeBBox([...l.points, ...pts]) }
              : l,
          )
        : [...linesRef.current, newLine];

      linesRef.current = updatedLines;
      setLines(updatedLines);

      // Wait for SVG render to settle before capturing
      if (!captureScheduled.current) {
        captureScheduled.current = true;
        setTimeout(async () => {
          captureScheduled.current = false;
          const base64 = await captureCanvas();
          onStrokeComplete(newLine, base64);
        }, 150);
      }
    },
  });

  const getUnderlineColor = (lineId: string): string | null => {
    if (confirmedErrorLineId === lineId) return UNDERLINE_COLORS.error;
    if (correctLineId === lineId) return UNDERLINE_COLORS.correct;
    if (flaggedLineId === lineId) return UNDERLINE_COLORS.flagged;
    return null;
  };

  return (
    <ViewShot ref={viewShotRef} style={styles.container} options={{ format: 'png', quality: 0.85 }}>
      <View style={styles.drawArea} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {strokes.map((stroke) => (
            <Path
              key={stroke.id}
              d={pointsToSvgPath(stroke.points)}
              stroke={stroke.crossedOut ? '#BBBBBB' : '#1A1A1A'}
              strokeWidth={stroke.crossedOut ? 1.5 : 2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={stroke.crossedOut ? 0.35 : 1}
            />
          ))}
        </Svg>

        {lines.map((line) => {
          const color = getUnderlineColor(line.id);
          if (!color) return null;
          return (
            <View
              key={`ul_${line.id}`}
              style={[
                styles.underline,
                { left: line.bbox.x, top: line.bbox.y + line.bbox.height + 6, width: Math.max(line.bbox.width, 20), backgroundColor: color },
              ]}
            />
          );
        })}
      </View>
    </ViewShot>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  drawArea: { flex: 1 },
  underline: { position: 'absolute', height: 3, borderRadius: 1.5 },
});
