import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Settings, Edit2, ChevronLeft, ChevronRight, CheckCircle2, Bell, Compass } from 'lucide-react-native';
import Logo from '../components/Logo';
import GradientButton from '../components/GradientButton';
import { useApp } from '../context/AppContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';

export default function Home() {
  const { state, setCurrentGoalIndex } = useApp();
  const { goals, currentGoalIndex } = state;
  const currentGoal = goals[currentGoalIndex];

  const nextGoal = () => {
    if (goals.length > 1) {
      setCurrentGoalIndex((currentGoalIndex + 1) % goals.length);
    }
  };

  const prevGoal = () => {
    if (goals.length > 1) {
      setCurrentGoalIndex((currentGoalIndex - 1 + goals.length) % goals.length);
    }
  };

  // Store current values in refs for panResponder
  const goalsRef = useRef(goals);
  const currentIndexRef = useRef(currentGoalIndex);
  goalsRef.current = goals;
  currentIndexRef.current = currentGoalIndex;

  // Swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const SWIPE_THRESHOLD = 50;
        const len = goalsRef.current.length;
        const idx = currentIndexRef.current;

        if (len <= 1) return;

        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right -> previous goal
          setCurrentGoalIndex((idx - 1 + len) % len);
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left -> next goal
          setCurrentGoalIndex((idx + 1) % len);
        }
      },
    })
  ).current;

  if (!currentGoal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No identities found.</Text>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Text style={styles.settingsLink}>Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Logo size={32} />
          <Text style={styles.appTitle}>Becoming</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/identity-check-in')}
          >
            <Compass size={20} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/signals')}
          >
            <Bell size={20} color={COLORS.muted} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/edit-goals')}
          >
            <Edit2 size={20} color={COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content - Swipeable */}
      <Animated.View
        entering={FadeIn.duration(800)}
        style={styles.mainContent}
        {...panResponder.panHandlers}
      >
        {/* Goal Navigation */}
        {goals.length > 1 ? (
          <View style={styles.goalNav}>
            <TouchableOpacity onPress={prevGoal} style={styles.navArrow}>
              <ChevronLeft size={20} color={COLORS.muted} />
            </TouchableOpacity>
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>{currentGoal.title}</Text>
            </View>
            <TouchableOpacity onPress={nextGoal} style={styles.navArrow}>
              <ChevronRight size={20} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>{currentGoal.title}</Text>
          </View>
        )}

        {/* Goal Counter */}
        {goals.length > 1 && (
          <Text style={styles.goalCounter}>
            {currentGoalIndex + 1} of {goals.length} identities
          </Text>
        )}

        {/* North Star Quote */}
        <Text style={styles.northStarText}>"{currentGoal.northStar}"</Text>

        {/* Why It Matters */}
        <View style={styles.whyContainer}>
          <Text style={styles.whyText}>{currentGoal.whyItMatters}</Text>
        </View>

        {/* Dot Indicators */}
        {goals.length > 1 && (
          <View style={styles.dots}>
            {goals.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setCurrentGoalIndex(idx)}
                style={[
                  styles.dot,
                  idx === currentGoalIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}
      </Animated.View>

      {/* Footer Button */}
      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.footer}>
        <GradientButton
          onPress={() => router.push('/check-in')}
          icon={<CheckCircle2 size={20} color={COLORS.primary} />}
        >
          Verify My Alignment
        </GradientButton>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.lg,
    color: COLORS.muted,
  },
  settingsLink: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: SPACING.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  appTitle: {
    fontFamily: FONTS.serifBoldItalic,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentSecondary,
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  // Main Content
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  goalNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  navArrow: {
    padding: SPACING.xs,
  },
  titleBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)',
    borderRadius: BORDER_RADIUS.full,
  },
  goalCounter: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    marginBottom: SPACING.md,
  },
  titleBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  northStarText: {
    fontFamily: FONTS.serifBold,
    fontSize: FONT_SIZES.display + 4,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  whyContainer: {
    maxWidth: 280,
    marginBottom: SPACING.xxl,
  },
  whyText: {
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },

  // Dots
  dots: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.accent,
  },

  // Footer
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
});
