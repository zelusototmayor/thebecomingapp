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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowRight, Check, MessageSquare, FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../components/Logo';
import GradientButton from '../components/GradientButton';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { Goal, Tone, Settings, DEFAULT_SETTINGS } from '../types';
import { reframeGoal, generateMainMission } from '../lib/ai';
import { generateId } from '../lib/storage';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, GRADIENT } from '../constants/theme';

export default function Onboarding() {
  const { setOnboarded } = useApp();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentNote, setCurrentNote] = useState('');
  const [isReframing, setIsReframing] = useState(false);
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [mainMission, setMainMission] = useState('');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const handleCreateGoal = async () => {
    if (!currentTitle.trim()) return;
    setIsReframing(true);

    const { northStar, whyItMatters } = await reframeGoal(
      currentTitle,
      currentNote,
      settings.notificationTone
    );

    const newGoal: Goal = {
      id: generateId(),
      title: currentTitle.trim(),
      note: currentNote.trim(),
      importance: 'med',
      northStar,
      whyItMatters,
      createdAt: Date.now(),
    };

    setGoals([...goals, newGoal]);
    setIsReframing(false);
    setStep(2);
  };

  const handlePersonalizationComplete = async () => {
    setStep(4);
    setIsGeneratingMission(true);
    const mission = await generateMainMission(goals);
    setMainMission(mission);
    setIsGeneratingMission(false);
  };

  const handleNextGoal = () => {
    setCurrentTitle('');
    setCurrentNote('');
    setStep(1);
  };

  const handleComplete = () => {
    setOnboarded(goals, settings, mainMission);
    router.replace('/home');
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeContent}>
          <Animated.View entering={FadeIn.duration(800)} style={styles.logoBox}>
            <Logo size={40} />
          </Animated.View>

          <Animated.Text entering={FadeIn.delay(200).duration(800)} style={styles.welcomeTitle}>
            Welcome to{'\n'}
            <Text style={styles.welcomeTitleGradient}>The Becoming App</Text>
          </Animated.Text>

          <Animated.Text entering={FadeIn.delay(400).duration(800)} style={styles.welcomeSubtitle}>
            We transform your goals into identities. Focus on who you are becoming, not just what you are doing.
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.welcomeButtonWrapper}>
            <GradientButton
              onPress={() => setStep(1)}
              style={styles.welcomeButton}
              icon={<ArrowRight size={18} color={COLORS.primary} />}
            >
              Begin My Evolution
            </GradientButton>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // Step 1: Add Goal
  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeIn.duration(500)}>
              <Text style={styles.stageLabel}>STAGE {goals.length + 1} OF 3</Text>
              <Text style={styles.stepTitle}>What identity do you wish to manifest?</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.inputsContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>THE GOAL</Text>
                <TextInput
                  style={styles.input}
                  value={currentTitle}
                  onChangeText={setCurrentTitle}
                  placeholder="e.g. Prolific Builder"
                  placeholderTextColor={COLORS.mutedDark}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PERSONAL CONTEXT</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={currentNote}
                  onChangeText={setCurrentNote}
                  placeholder="Describe why this matters. How does this fit into the person you are becoming?"
                  placeholderTextColor={COLORS.mutedDark}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </Animated.View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton
              onPress={handleCreateGoal}
              disabled={!currentTitle.trim() || isReframing}
              loading={isReframing}
              icon={isReframing ? undefined : <ArrowRight size={18} color={COLORS.primary} />}
            >
              {isReframing ? 'Reframing with AI...' : 'Set Future Identity'}
            </GradientButton>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 2: Review
  if (step === 2) {
    const lastGoal = goals[goals.length - 1];
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeIn.duration(600)}>
            <Text style={styles.reviewLabel}>YOUR FUTURE SELF, DEFINED</Text>

            <View style={styles.quoteContainer}>
              <Text style={styles.quoteIcon}>"</Text>
              <Text style={styles.northStarText}>{lastGoal.northStar}"</Text>
            </View>

            <View style={styles.whyCard}>
              <Text style={styles.whyLabel}>THE DEEPER ALIGNMENT</Text>
              <Text style={styles.whyText}>{lastGoal.whyItMatters}</Text>
            </View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          {goals.length < 3 && (
            <Button
              variant="secondary"
              onPress={handleNextGoal}
              style={styles.secondaryButton}
            >
              Add Another Identity
            </Button>
          )}
          <GradientButton
            onPress={() => setStep(3)}
            icon={<ArrowRight size={18} color={COLORS.primary} />}
          >
            Proceed to Personalize
          </GradientButton>
        </View>
      </SafeAreaView>
    );
  }

  // Step 3: Personalization (Tone)
  if (step === 3) {
    const toneOptions: { id: Tone; label: string; desc: string }[] = [
      { id: 'gentle', label: 'Gentle', desc: 'Patient and nurturing.' },
      { id: 'direct', label: 'Direct', desc: 'No-nonsense accountability.' },
      { id: 'motivational', label: 'Motivational', desc: 'High-energy and driving.' },
    ];

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeIn.duration(500)}>
            <Text style={styles.stepTitle}>Refine the Voice</Text>
            <Text style={styles.stepSubtitle}>
              How should your Becoming App guide your evolution?
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.toneSection}>
            <View style={styles.toneLabelRow}>
              <MessageSquare size={16} color={COLORS.muted} />
              <Text style={styles.toneLabel}>REMINDERS TONE</Text>
            </View>

            {toneOptions.map((tone) => (
              <TouchableOpacity
                key={tone.id}
                style={[
                  styles.toneCard,
                  settings.notificationTone === tone.id && styles.toneCardSelected,
                ]}
                onPress={() => setSettings({ ...settings, notificationTone: tone.id })}
                activeOpacity={0.8}
              >
                <View style={styles.toneCardContent}>
                  <Text
                    style={[
                      styles.toneTitle,
                      settings.notificationTone === tone.id && styles.toneTitleSelected,
                    ]}
                  >
                    {tone.label}
                  </Text>
                  <Text
                    style={[
                      styles.toneDesc,
                      settings.notificationTone === tone.id && styles.toneDescSelected,
                    ]}
                  >
                    {tone.desc}
                  </Text>
                </View>
                {settings.notificationTone === tone.id && (
                  <Check size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton
            onPress={handlePersonalizationComplete}
            icon={<ArrowRight size={18} color={COLORS.primary} />}
          >
            Finalize My Journey
          </GradientButton>
        </View>
      </SafeAreaView>
    );
  }

  // Step 4: Manifesto
  if (step === 4) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeIn.duration(500)}>
            <Text style={styles.manifestoLabel}>THE BECOMING MANIFESTO</Text>
            <Text style={styles.manifestoTitle}>Your Grand Identity</Text>
          </Animated.View>

          {isGeneratingMission ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>
                Synthesizing your evolution into a unified philosophy...
              </Text>
            </View>
          ) : (
            <Animated.View entering={FadeIn.delay(200).duration(800)}>
              <LinearGradient
                colors={['rgba(20, 184, 166, 0.2)', COLORS.card, 'rgba(245, 158, 11, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.manifestoCard}
              >
                <FileText size={48} color="rgba(20, 184, 166, 0.1)" style={styles.manifestoIcon} />
                <Text style={styles.manifestoText}>"{mainMission}"</Text>
              </LinearGradient>

              <View style={styles.dimensionsSection}>
                <Text style={styles.dimensionsLabel}>CORE DIMENSIONS</Text>
                {goals.map((goal, idx) => (
                  <View key={goal.id} style={styles.dimensionCard}>
                    <Text style={styles.dimensionLabel}>
                      IDENTITY {idx + 1}: {goal.title.toUpperCase()}
                    </Text>
                    <Text style={styles.dimensionText}>"{goal.northStar}"</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {!isGeneratingMission && (
          <View style={styles.footer}>
            <GradientButton onPress={handleComplete}>
              Start My New Life
            </GradientButton>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  footer: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  // Welcome (Step 0)
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  welcomeTitle: {
    fontFamily: FONTS.serifBold,
    fontSize: 40,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 48,
  },
  welcomeTitleGradient: {
    fontFamily: FONTS.serifBoldItalic,
    color: COLORS.accent,
  },
  welcomeSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.lg,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
    marginBottom: SPACING.xxl,
  },
  welcomeButtonWrapper: {
    width: '100%',
    maxWidth: 280,
  },
  welcomeButton: {
    width: '100%',
  },

  // Step 1: Add Goal
  stageLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  },
  stepTitle: {
    fontFamily: FONTS.serifBold,
    fontSize: FONT_SIZES.xxxl + 4,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  stepSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.lg,
    color: COLORS.muted,
    marginBottom: SPACING.lg,
  },
  inputsContainer: {
    marginTop: SPACING.lg,
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: SPACING.sm,
  },
  inputLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    letterSpacing: 2,
    marginLeft: SPACING.xs,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  textArea: {
    minHeight: 140,
    paddingTop: SPACING.md,
    lineHeight: 24,
  },

  // Step 2: Review
  reviewLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    letterSpacing: 3,
    marginBottom: SPACING.md,
  },
  quoteContainer: {
    marginBottom: SPACING.xl,
  },
  quoteIcon: {
    fontFamily: FONTS.serifBold,
    fontSize: 80,
    color: 'rgba(20, 184, 166, 0.1)',
    position: 'absolute',
    top: -30,
    left: -10,
  },
  northStarText: {
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.display,
    color: COLORS.primary,
    lineHeight: 42,
    paddingLeft: SPACING.sm,
  },
  whyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
  },
  whyLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accentSecondary,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  whyText: {
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.lg,
    color: COLORS.mutedLight,
    lineHeight: 26,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Step 3: Personalization
  toneSection: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  toneLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  toneLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    letterSpacing: 2,
  },
  toneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: SPACING.lg,
  },
  toneCardSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accentLight,
  },
  toneCardContent: {
    flex: 1,
  },
  toneTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.mutedLight,
    marginBottom: SPACING.xs,
  },
  toneTitleSelected: {
    color: COLORS.primary,
  },
  toneDesc: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
  },
  toneDescSelected: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Step 4: Manifesto
  manifestoLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accentSecondary,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  },
  manifestoTitle: {
    fontFamily: FONTS.serifBold,
    fontSize: FONT_SIZES.display,
    color: COLORS.primary,
    marginBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  loadingText: {
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.lg,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  manifestoCard: {
    borderRadius: BORDER_RADIUS.xxxl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.xl + 8,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  manifestoIcon: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
  },
  manifestoText: {
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.primary,
    lineHeight: 34,
  },
  dimensionsSection: {
    gap: SPACING.md,
  },
  dimensionsLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    letterSpacing: 4,
    marginBottom: SPACING.sm,
  },
  dimensionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
  },
  dimensionLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  dimensionText: {
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.lg,
    color: COLORS.mutedLight,
    lineHeight: 26,
  },
});
