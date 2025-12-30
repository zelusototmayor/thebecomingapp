import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Trash2, Plus } from 'lucide-react-native';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';

const MAX_GOALS = 3;

export default function EditGoalsScreen() {
  const { state, deleteGoal } = useApp();
  const { goals } = state;

  const handleDelete = (id: string) => {
    if (goals.length <= 1) {
      Alert.alert('Cannot Delete', 'You need at least one goal to continue your evolution.');
      return;
    }

    Alert.alert(
      'Delete Goal',
      'This will remove this identity path. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGoal(id),
        },
      ]
    );
  };

  const handleAddGoal = () => {
    // Navigate to onboarding step 1 to add a new goal
    // In a full implementation, this could be a separate add-goal screen
    Alert.alert(
      'Add New Goal',
      'To add a new goal, you can reset your evolution and start fresh, or continue with your current identities.',
      [
        { text: 'Keep Current', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.muted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Compass</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Goal Cards */}
        {goals.map((goal, index) => (
          <Animated.View
            key={goal.id}
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={styles.goalCard}
          >
            {/* Delete Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(goal.id)}
            >
              <Trash2 size={20} color={COLORS.mutedDark} />
            </TouchableOpacity>

            {/* Goal Content */}
            <View style={styles.goalContent}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalNorthStar}>"{goal.northStar}"</Text>
              <Text style={styles.goalWhyItMatters}>{goal.whyItMatters}</Text>
            </View>
          </Animated.View>
        ))}

        {/* Add New Goal Button */}
        {goals.length < MAX_GOALS && (
          <Animated.View entering={FadeIn.delay(300).duration(400)}>
            <TouchableOpacity
              style={styles.addGoalButton}
              onPress={handleAddGoal}
              activeOpacity={0.7}
            >
              <Plus size={24} color={COLORS.mutedDark} style={styles.addIcon} />
              <Text style={styles.addGoalText}>Add New Goal</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button variant="primary" onPress={() => router.back()}>
          Done
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontFamily: FONTS.serifBold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },

  // Goal Card
  goalCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  deleteButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    padding: SPACING.sm,
    zIndex: 1,
  },
  goalContent: {
    paddingRight: SPACING.xl,
  },
  goalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.accent,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  goalNorthStar: {
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primaryMuted,
    lineHeight: 28,
    marginBottom: SPACING.sm,
  },
  goalWhyItMatters: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Add Goal Button
  addGoalButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.mutedDark,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    marginBottom: SPACING.sm,
  },
  addGoalText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedDark,
  },

  // Footer
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
});
