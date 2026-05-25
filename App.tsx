import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Problem } from './src/types';
import { ProblemSelectScreen } from './src/screens/ProblemSelectScreen';
import { SessionScreen } from './src/screens/SessionScreen';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

export default function App() {
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

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
