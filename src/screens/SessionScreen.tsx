import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

function useIsTablet(): boolean {
  const { width, height } = Dimensions.get('window');
  const longest = Math.max(width, height);
  const shortest = Math.min(width, height);
  // iPad: shortest side ≥ 768. Also check platform idiom if available.
  return (Platform as { isPad?: boolean }).isPad === true || shortest >= 768 || longest >= 1024;
}

type SidebarTab = 'hints' | 'session';

export function SessionScreen({ problem, apiKey, onBack }: SessionScreenProps) {
  const isTablet = useIsTablet();
  const [activeTab, setActiveTab] = useState<SidebarTab>('hints');

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

  const statusColor =
    session.status === 'complete'
      ? COLORS.teal
      : session.status === 'error_found'
        ? COLORS.red
        : session.status === 'classifying'
          ? COLORS.purple
          : COLORS.gray;

  const helpDisabled =
    session.status === 'classifying' ||
    session.status === 'complete' ||
    session.status === 'error_found';

  const sidebarContent = (
    <ScrollView style={styles.sidebarScroll} contentContainerStyle={styles.sidebarScrollContent}>
      <View style={styles.statsSection}>
        <Text style={styles.statsLabel}>SESSION</Text>
        <Text style={styles.statLine}>Steps: {session.stepsCompleted}</Text>
        <Text style={styles.statLine}>Hints used: {session.hintsUsed} / 25</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor.light }]}>
          <Text style={[styles.statusPillText, { color: statusColor.dark }]}>
            {STATUS_LABELS[session.status] ?? session.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <HintLadderPanel
        ladder={session.ladder}
        ladderReady={ladderReady}
        ladderProgress={ladderProgress}
        onUnlockNext={unlockNextHint}
      />

      <View style={styles.divider} />

      <View style={styles.helpSection}>
        <Pressable
          style={[styles.helpButton, helpDisabled && styles.helpButtonDisabled]}
          onPress={onRequestHelp}
          disabled={helpDisabled}
        >
          <Text style={styles.helpButtonText}>I'm stuck — help</Text>
        </Pressable>
        {session.status === 'error_found' && (
          <Text style={styles.errorHintPrompt}>Use the hint ladder to work through the error →</Text>
        )}
      </View>
    </ScrollView>
  );

  if (isTablet) {
    // ── iPad layout: canvas left, sidebar right ──────────────────────────
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
            <Text style={styles.brandText}>euler</Text>
            <Text style={styles.headerSep}> · </Text>
            <Text style={styles.conceptText}>{problem.concept}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.light }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor.dark }]}>
              {STATUS_LABELS[session.status] ?? session.status}
            </Text>
          </View>
        </View>

        <View style={styles.tabletBody}>
          <View style={styles.canvasColumn}>
            <View style={styles.problemBar}>
              <Text style={styles.problemText}>{problem.text}</Text>
            </View>
            <EulerCanvas
              flaggedLineId={flaggedLineId}
              confirmedErrorLineId={confirmedErrorLineId}
              correctLineId={null}
              onStrokeComplete={onStrokeComplete}
            />
          </View>

          <View style={styles.tabletSidebar}>{sidebarContent}</View>
        </View>
      </View>
    );
  }

  // ── iPhone layout: canvas top, tabbed bottom panel ───────────────────
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.brandText}>euler</Text>
          <Text style={styles.headerSep}> · </Text>
          <Text style={styles.conceptText} numberOfLines={1}>{problem.concept}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.light }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor.dark }]}>
            {STATUS_LABELS[session.status] ?? session.status}
          </Text>
        </View>
      </View>

      {/* Problem text */}
      <View style={styles.problemBar}>
        <Text style={styles.problemText}>{problem.text}</Text>
      </View>

      {/* Canvas — takes ~55% of remaining height */}
      <View style={styles.phoneCanvas}>
        <EulerCanvas
          flaggedLineId={flaggedLineId}
          confirmedErrorLineId={confirmedErrorLineId}
          correctLineId={null}
          onStrokeComplete={onStrokeComplete}
        />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['hints', 'session'] as SidebarTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabBarItem, activeTab === tab && styles.tabBarItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabBarText, activeTab === tab && styles.tabBarTextActive]}>
              {tab === 'hints' ? `Hints ${session.hintsUsed > 0 ? `(${session.hintsUsed})` : ''}` : 'Session'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Bottom panel */}
      <View style={styles.phonePanel}>
        {activeTab === 'hints' ? (
          <>
            <HintLadderPanel
              ladder={session.ladder}
              ladderReady={ladderReady}
              ladderProgress={ladderProgress}
              onUnlockNext={unlockNextHint}
            />
            <View style={styles.divider} />
            <View style={styles.helpSection}>
              <Pressable
                style={[styles.helpButton, helpDisabled && styles.helpButtonDisabled]}
                onPress={onRequestHelp}
                disabled={helpDisabled}
              >
                <Text style={styles.helpButtonText}>I'm stuck — help</Text>
              </Pressable>
              {session.status === 'error_found' && (
                <Text style={styles.errorHintPrompt}>Use the hint ladder →</Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.statsSection}>
            <Text style={styles.statsLabel}>SESSION</Text>
            <Text style={styles.statLine}>Steps: {session.stepsCompleted}</Text>
            <Text style={styles.statLine}>Hints used: {session.hintsUsed} / 25</Text>
            <Text style={styles.statLine}>Problem: {problem.concept}</Text>
            <Text style={styles.statLine}>Difficulty: {'●'.repeat(problem.difficulty)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray.light,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
  backButton: { marginRight: 8, padding: 4 },
  backText: { fontSize: 18, color: COLORS.gray.dark },
  brandText: { fontSize: 15, fontWeight: '500', color: COLORS.purple.primary },
  headerSep: { color: COLORS.gray.primary, fontSize: 15 },
  conceptText: { fontSize: 13, color: COLORS.gray.primary, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' },

  // Problem bar
  problemBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray.light,
    backgroundColor: '#FDFDFB',
  },
  problemText: { fontSize: 15, fontStyle: 'italic', color: COLORS.gray.primary, lineHeight: 22 },

  // Tablet layout
  tabletBody: { flex: 1, flexDirection: 'row' },
  canvasColumn: { flex: 1, borderRightWidth: 0.5, borderRightColor: COLORS.gray.light },
  tabletSidebar: { width: 300 },
  sidebarScroll: { flex: 1 },
  sidebarScrollContent: { paddingBottom: 24 },

  // Phone layout
  phoneCanvas: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray.light,
    backgroundColor: COLORS.white,
  },
  tabBarItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabBarItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.purple.primary,
  },
  tabBarText: { fontSize: 13, color: COLORS.gray.primary, fontWeight: '400' },
  tabBarTextActive: { color: COLORS.purple.primary, fontWeight: '500' },
  phonePanel: { maxHeight: 280, borderTopWidth: 0.5, borderTopColor: COLORS.gray.light },

  // Shared sidebar content
  statsSection: { padding: 16, gap: 6 },
  statsLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: COLORS.gray.primary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statLine: { fontSize: 13, color: COLORS.gray.dark, lineHeight: 20 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  statusPillText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.4, textTransform: 'uppercase' },
  divider: { height: 0.5, backgroundColor: COLORS.gray.light },
  helpSection: { padding: 16, gap: 8 },
  helpButton: {
    backgroundColor: COLORS.amber.light,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: COLORS.amber.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  helpButtonDisabled: { opacity: 0.4 },
  helpButtonText: { fontSize: 13, fontWeight: '500', color: COLORS.amber.dark },
  errorHintPrompt: { fontSize: 12, color: COLORS.red.primary, textAlign: 'center' },
});
