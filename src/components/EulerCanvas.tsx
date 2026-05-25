import React, { useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BoundingBox, Point, StrokeLine } from '../types';
import { UNDERLINE_COLORS } from '../constants/colors';

interface EulerCanvasProps {
  flaggedLineId: string | null;
  confirmedErrorLineId: string | null;
  onStrokeComplete: (line: StrokeLine, canvasBase64: string) => void;
}

const LINE_CLUSTER_THRESHOLD = 30;

function generateId(): string {
  return `line_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function computeBBox(points: Point[]): BoundingBox {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function isCrossOutGesture(bbox: BoundingBox, pointCount: number): boolean {
  return pointCount < 15 && bbox.width > bbox.height * 3 && bbox.height < 20;
}

function clusterIntoLine(
  points: Point[],
  existingLines: StrokeLine[],
): { lineId: string; isNew: boolean } {
  if (points.length === 0) return { lineId: generateId(), isNew: true };
  const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

  for (const line of existingLines) {
    const lineAvgY =
      line.points.reduce((sum, p) => sum + p.y, 0) / line.points.length;
    if (Math.abs(avgY - lineAvgY) < LINE_CLUSTER_THRESHOLD) {
      return { lineId: line.id, isNew: false };
    }
  }

  return { lineId: generateId(), isNew: true };
}

export function EulerCanvas({
  flaggedLineId,
  confirmedErrorLineId,
  onStrokeComplete,
}: EulerCanvasProps) {
  const [lines, setLines] = useState<StrokeLine[]>([]);
  const currentPointsRef = useRef<Point[]>([]);
  const canvasRef = useRef<View>(null);

  const handleStrokeEnd = useCallback(
    (strokePoints: Point[]) => {
      if (strokePoints.length === 0) return;

      const bbox = computeBBox(strokePoints);
      const crossedOut = isCrossOutGesture(bbox, strokePoints.length);

      const { lineId, isNew } = clusterIntoLine(strokePoints, lines);

      const newLine: StrokeLine = {
        id: isNew ? lineId : generateId(),
        points: strokePoints,
        bbox,
        crossedOut,
        timestamp: Date.now(),
      };

      const updatedLines = [...lines, newLine];
      setLines(updatedLines);

      // In production this would capture the PencilKit canvas as base64
      // For now we pass an empty string — the classifier handles missing images gracefully
      onStrokeComplete(newLine, '');
    },
    [lines, onStrokeComplete],
  );

  const getUnderlineColor = (lineId: string): string | null => {
    if (confirmedErrorLineId === lineId) return UNDERLINE_COLORS.error;
    if (flaggedLineId === lineId) return UNDERLINE_COLORS.flagged;
    return null;
  };

  return (
    <View ref={canvasRef} style={styles.container}>
      {Platform.OS === 'ios' ? (
        // PencilKit native view will go here
        // For now, render a placeholder that shows the canvas area
        <View style={styles.canvasPlaceholder} />
      ) : (
        <View style={styles.canvasPlaceholder} />
      )}

      {/* Underline overlays */}
      {lines.map((line) => {
        const color = getUnderlineColor(line.id);
        if (!color) return null;
        return (
          <View
            key={`underline_${line.id}`}
            style={[
              styles.underline,
              {
                left: line.bbox.x,
                top: line.bbox.y + line.bbox.height + 4,
                width: line.bbox.width,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  canvasPlaceholder: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  underline: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
  },
});
