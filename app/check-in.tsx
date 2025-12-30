import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { X, MessageCircle, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '../components/GradientButton';
import { useApp } from '../context/AppContext';
import { CheckIn } from '../types';
import { generateId } from '../lib/storage';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, GRADIENT } from '../constants/theme';

type Response = 'yes' | 'somewhat' | 'no';

const RESPONSE_OPTIONS: { id: Response; label: string; sub: string }[] = [
  { id: 'yes', label: 'Absolute Alignment', sub: 'I was that person' },
  { id: 'somewhat', label: 'Partial Alignment', sub: 'Progress was made' },
  { id: 'no', label: 'Divergence', sub: 'Today was a setback' },
];

export default function CheckInScreen() {
  const { state, addCheckIn } = useApp();
  const currentGoal = state.goals[state.currentGoalIndex];
  const [response, setResponse] = useState<Response | null>(null);
  const [reflection, setReflection] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!response || !currentGoal) return;

    const newCheckIn: CheckIn = {
      id: generateId(),
      type: 'goal',
      goalId: currentGoal.id,
      date: Date.now(),
      response,
      reflection: reflection.trim(),
    };

    addCheckIn(newCheckIn);
    setIsSaved(true);

    setTimeout(() => {
      router.back();
    }, 2500);
  };

  if (!currentGoal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No goal selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSaved) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View entering={ZoomIn.duration(500)} style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <Sparkles size={40} color={COLORS.accent} />
          </View>
          <Text style={styles.successTitle}>Authenticity Recorded.</Text>
          <Text style={styles.successText}>
            The version of you that exists tomorrow is built by the choices you made today.
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>IDENTITY ALIGNMENT</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Goal Quote */}
          <View style={styles.goalSection}>
            <Text style={styles.goalLabel}>FUTURE IDENTITY</Text>
            <Text style={styles.goalQuote}>"{currentGoal.northStar}"</Text>
          </View>

          {/* Question */}
          <View style={styles.questionSection}>
            <Text style={styles.questionText}>
              Did your actions today match this emerging identity?
            </Text>

            {/* Response Options */}
            <View style={styles.optionsContainer}>
              {RESPONSE_OPTIONS.map((option) => {
                const isSelected = response === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setResponse(option.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={GRADIENT.colors}
                        start={GRADIENT.start}
                        end={GRADIENT.end}
                        style={styles.optionCard}
                      >
                        <Text style={styles.optionLabelSelected}>{option.label}</Text>
                        <Text style={styles.optionSubSelected}>{option.sub}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.optionCardUnselected}>
                        <Text style={styles.optionLabel}>{option.label}</Text>
                        <Text style={styles.optionSub}>{option.sub}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Reflection */}
          <View style={styles.reflectionSection}>
            <View style={styles.reflectionLabelRow}>
              <MessageCircle size={16} color={COLORS.muted} />
              <Text style={styles.reflectionLabel}>REFLECT ON THE SHIFT</Text>
            </View>
            <TextInput
              style={styles.reflectionInput}
              value={reflection}
              onChangeText={setReflection}
              placeholder="What did you learn about your future self today?"
              placeholderTextColor={COLORS.mutedDark}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <GradientButton
            onPress={handleSave}
            disabled={!response}
          >
            Confirm My Evolution
          </GradientButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.lg,
    color: COLORS.muted,
  },

  // Success State
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  successTitle: {
    fontFamily: FONTS.serifBoldItalic,
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  successText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.lg,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 280,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    letterSpacing: 4,
  },
  closeButton: {
    padding: SPACING.sm,
  },

  // Scroll Content
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },

  // Goal Section
  goalSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  goalLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    letterSpacing: 3,
    marginBottom: SPACING.md,
  },
  goalQuote: {
    fontFamily: FONTS.serifBoldItalic,
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 36,
  },

  // Question Section
  questionSection: {
    marginBottom: SPACING.xl,
  },
  questionText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  optionCard: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  optionCardUnselected: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: SPACING.lg,
    alignItems: 'center',
  },
  optionLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  optionLabelSelected: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  optionSub: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  optionSubSelected: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Reflection Section
  reflectionSection: {
    marginBottom: SPACING.lg,
  },
  reflectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  reflectionLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    letterSpacing: 2,
  },
  reflectionInput: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    minHeight: 120,
  },

  // Footer
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
});
