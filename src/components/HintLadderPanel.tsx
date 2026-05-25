import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HintLadder } from '../types';
import { COLORS, TIER_COLORS } from '../constants/colors';

interface HintLadderPanelProps {
  ladder: HintLadder | null;
  ladderReady: boolean;
  ladderProgress: number;
  onUnlockNext: () => void;
}

const TIER_LABELS: Record<string, string> = {
  nudge: 'NUDGE',
  concept: 'CONCEPT',
  example: 'EXAMPLE',
  partial: 'PARTIAL',
  solution: 'SOLUTION',
};

export function HintLadderPanel({
  ladder,
  ladderReady,
  ladderProgress,
  onUnlockNext,
}: HintLadderPanelProps) {
  if (!ladderReady || !ladder) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingLabel}>PREPARING HINTS</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(ladderProgress / 25) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{ladderProgress} / 25</Text>
      </View>
    );
  }

  const currentHint = ladder.currentIndex >= 0 ? ladder.hints[ladder.currentIndex] : null;
  const canUnlock = ladder.currentIndex < ladder.hints.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.segmentBar}>
        {ladder.hints.map((hint, i) => {
          const colors = TIER_COLORS[hint.tier];
          const isUnlocked = hint.unlocked;
          const isCurrent = i === ladder.currentIndex;
          return (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  backgroundColor: isUnlocked ? colors.border : COLORS.gray.light,
                  borderColor: isCurrent ? colors.text : 'transparent',
                  borderWidth: isCurrent ? 1 : 0,
                },
              ]}
            />
          );
        })}
      </View>

      <Text style={styles.counterText}>
        {ladder.currentIndex + 1} / {ladder.hints.length} hints used
      </Text>

      {currentHint && (
        <ScrollView style={styles.hintCardScroll}>
          <View
            style={[
              styles.hintCard,
              {
                backgroundColor: TIER_COLORS[currentHint.tier].bg,
                borderColor: TIER_COLORS[currentHint.tier].border,
              },
            ]}
          >
            <Text
              style={[styles.tierLabel, { color: TIER_COLORS[currentHint.tier].text }]}
            >
              {TIER_LABELS[currentHint.tier]}
            </Text>
            <Text style={[styles.hintText, { color: TIER_COLORS[currentHint.tier].text }]}>
              {currentHint.text}
            </Text>
          </View>
        </ScrollView>
      )}

      {!currentHint && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Tap below when you need a hint</Text>
        </View>
      )}

      {canUnlock && (
        <Pressable style={styles.unlockButton} onPress={onUnlockNext}>
          <Text style={styles.unlockButtonText}>
            {ladder.currentIndex < 0 ? 'Get first hint' : 'Next hint'}
          </Text>
        </Pressable>
      )}

      {!canUnlock && ladder.currentIndex >= 0 && (
        <Text style={styles.exhaustedText}>All hints used</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  loadingLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: COLORS.gray.primary,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.gray.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.purple.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.gray.primary,
    textAlign: 'center',
  },
  segmentBar: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
  },
  segment: {
    flex: 1,
    borderRadius: 3,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: COLORS.gray.primary,
    textTransform: 'uppercase',
  },
  hintCardScroll: {
    maxHeight: 200,
  },
  hintCard: {
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 16,
    gap: 8,
  },
  tierLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  hintText: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.gray.primary,
    fontStyle: 'italic',
  },
  unlockButton: {
    backgroundColor: COLORS.purple.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
  },
  exhaustedText: {
    fontSize: 11,
    color: COLORS.gray.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
