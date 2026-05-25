import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Problem } from '../types';
import { useSession } from '../hooks/useSession';
import { EulerCanvas } from '../components/EulerCanvas';
import { HintLadderPanel } from '../components/HintLadderPanel';
import { COLORS } from '../constants/colors';

interface SessionScreenProps {
  problem: Problem;
  apiKey: string;
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'loading',
  watching: 'watching',
  classifying: 'thinking…',
  error_found: 'error found',
  complete: 'complete ✓',
};

export function SessionScreen({ problem, apiKey, onBack }: SessionScreenProps) {
  const {
    session,
    ladderReady,
    ladderProgress,
    flaggedLineId,
    confirmedErrorLineId,
    onStrokeComplete,
    onRequestHelp,
    unlockNextHint,
  } = useSession(problem, apiKey);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.brandText}>euler</Text>
          <Text style={styles.conceptDot}> · </Text>
          <Text style={styles.conceptText}>{problem.concept}</Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  session.status === 'complete'
                    ? COLORS.teal.light
                    : session.status === 'error_found'
                      ? COLORS.red.light
                      : COLORS.gray.light,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    session.status === 'complete'
                      ? COLORS.teal.dark
                      : session.status === 'error_found'
                        ? COLORS.red.dark
                        : COLORS.gray.dark,
                },
              ]}
            >
              {STATUS_LABELS[session.status] ?? session.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.body}>
        {/* Canvas area */}
        <View style={styles.canvasColumn}>
          <View style={styles.problemBar}>
            <Text style={styles.problemText}>{problem.text}</Text>
          </View>
          <EulerCanvas
            flaggedLineId={flaggedLineId}
            confirmedErrorLineId={confirmedErrorLineId}
            onStrokeComplete={onStrokeComplete}
          />
        </View>

        {/* Right sidebar */}
        <View style={styles.sidebar}>
          {/* Session stats */}
          <View style={styles.statsSection}>
            <Text style={styles.statsLabel}>SESSION</Text>
            <Text style={styles.statLine}>
              steps: {session.stepsCompleted}
            </Text>
            <Text style={styles.statLine}>
              hints: {session.hintsUsed}/25
            </Text>
            <Text style={styles.statLine}>
              status: {STATUS_LABELS[session.status] ?? session.status}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Hint ladder */}
          <HintLadderPanel
            ladder={session.ladder}
            ladderReady={ladderReady}
            ladderProgress={ladderProgress}
            onUnlockNext={unlockNextHint}
          />

          <View style={styles.divider} />

          {/* Help button */}
          <View style={styles.helpSection}>
            <Pressable
              style={[
                styles.helpButton,
                session.status === 'classifying' && styles.helpButtonDisabled,
              ]}
              onPress={onRequestHelp}
              disabled={session.status === 'classifying' || session.status === 'complete'}
            >
              <Text style={styles.helpButtonText}>I'm stuck — help</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backText: {
    fontSize: 18,
    color: COLORS.gray.dark,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.purple.primary,
  },
  conceptDot: {
    color: COLORS.gray.primary,
  },
  conceptText: {
    fontSize: 14,
    color: COLORS.gray.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  canvasColumn: {
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: COLORS.gray.light,
  },
  problemBar: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray.light,
  },
  problemText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.gray.primary,
    lineHeight: 24,
  },
  sidebar: {
    width: 300,
  },
  statsSection: {
    padding: 16,
    gap: 4,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: COLORS.gray.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statLine: {
    fontSize: 13,
    color: COLORS.gray.dark,
    lineHeight: 20,
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.gray.light,
  },
  helpSection: {
    padding: 16,
  },
  helpButton: {
    backgroundColor: COLORS.amber.light,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: COLORS.amber.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  helpButtonDisabled: {
    opacity: 0.5,
  },
  helpButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.amber.dark,
  },
});
