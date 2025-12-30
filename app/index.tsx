import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING } from '../constants/theme';

export default function Index() {
  const { state, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        if (!state.user) {
          // No user logged in
          router.replace('/login');
        } else if (!state.settings.hasOnboarded) {
          // User exists but hasn't completed onboarding
          router.replace('/onboarding');
        } else {
          // Fully onboarded user
          router.replace('/home');
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isLoading, state.user, state.settings.hasOnboarded]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
});
