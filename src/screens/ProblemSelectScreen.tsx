import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Problem } from '../types';
import { PROBLEMS } from '../constants/problems';
import { COLORS } from '../constants/colors';

interface ProblemSelectScreenProps {
  onSelect: (problem: Problem) => void;
}

const DIFFICULTY_LABELS = ['', '●', '●●', '●●●'];

const SUBJECT_COLORS: Record<string, string> = {
  algebra: COLORS.purple.primary,
  calculus: COLORS.teal.primary,
  geometry: COLORS.amber.primary,
};

export function ProblemSelectScreen({ onSelect }: ProblemSelectScreenProps) {
  const grouped = PROBLEMS.reduce(
    (acc, p) => {
      if (!acc[p.subject]) acc[p.subject] = [];
      acc[p.subject].push(p);
      return acc;
    },
    {} as Record<string, Problem[]>,
  );

  const sections = Object.entries(grouped);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brandText}>euler</Text>
        <Text style={styles.subtitle}>Choose a problem</Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={([subject]) => subject}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: [subject, problems] }) => (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.subjectDot,
                  { backgroundColor: SUBJECT_COLORS[subject] ?? COLORS.gray.primary },
                ]}
              />
              <Text style={styles.sectionTitle}>{subject.toUpperCase()}</Text>
            </View>
            {problems.map((problem) => (
              <Pressable
                key={problem.id}
                style={styles.problemCard}
                onPress={() => onSelect(problem)}
              >
                <View style={styles.problemCardContent}>
                  <Text style={styles.conceptLabel}>{problem.concept}</Text>
                  <Text style={styles.problemText} numberOfLines={2}>
                    {problem.text}
                  </Text>
                </View>
                <Text style={styles.difficulty}>
                  {DIFFICULTY_LABELS[problem.difficulty]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 4,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '500',
    color: COLORS.purple.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: COLORS.gray.primary,
  },
  problemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.gray.light,
    borderRadius: 10,
    marginBottom: 8,
  },
  problemCardContent: {
    flex: 1,
    gap: 4,
  },
  conceptLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.gray.primary,
    letterSpacing: 0.3,
  },
  problemText: {
    fontSize: 14,
    color: COLORS.gray.dark,
    lineHeight: 20,
  },
  difficulty: {
    fontSize: 10,
    color: COLORS.amber.primary,
    marginLeft: 12,
  },
});
