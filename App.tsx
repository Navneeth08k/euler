import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Problem } from './src/types';
import { ProblemSelectScreen } from './src/screens/ProblemSelectScreen';
import { SessionScreen } from './src/screens/SessionScreen';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

function MissingKeyScreen() {
  return (
    <View style={styles.errorRoot}>
      <Text style={styles.errorTitle}>euler</Text>
      <Text style={styles.errorBody}>
        {'EXPO_PUBLIC_GEMINI_API_KEY is not set.\n\nAdd it to your .env file and restart the dev server.'}
      </Text>
    </View>
  );
}

export default function App() {
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  if (!API_KEY) return <MissingKeyScreen />;

  return (
    <>
      <StatusBar style="dark" />
      {selectedProblem ? (
        <SessionScreen
          problem={selectedProblem}
          apiKey={API_KEY}
          onBack={() => setSelectedProblem(null)}
        />
      ) : (
        <ProblemSelectScreen onSelect={setSelectedProblem} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  errorRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#FAFAF8' },
  errorTitle: { fontSize: 32, fontWeight: '500', color: '#534AB7', marginBottom: 16 },
  errorBody: { fontSize: 14, color: '#888780', textAlign: 'center', lineHeight: 22 },
});
