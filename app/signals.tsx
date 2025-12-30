import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Sparkles,
  Clock,
  HelpCircle,
  MessageSquareQuote,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Signal } from '../types';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';

export default function SignalsScreen() {
  const { state, updateSignalFeedback } = useApp();
  const { signals } = state;

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const getSignalIcon = (type: Signal['type']) => {
    switch (type) {
      case 'insight':
        return <Sparkles size={20} color={COLORS.accentSecondary} />;
      case 'inquiry':
        return <HelpCircle size={20} color={COLORS.accent} />;
      case 'manifesto':
        return <MessageSquareQuote size={20} color={COLORS.success} />;
    }
  };

  const getSignalColor = (type: Signal['type']) => {
    switch (type) {
      case 'insight':
        return COLORS.accentSecondary;
      case 'inquiry':
        return COLORS.accent;
      case 'manifesto':
        return COLORS.success;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.muted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evolution Logs</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Sparkles size={20} color={COLORS.accent} />
            <Text style={styles.infoTitle}>ACTIVE INTELLIGENCE</Text>
          </View>
          <Text style={styles.infoText}>
            Your signals are generated in real-time. Use feedback to train your evolution's voice.
          </Text>
        </Animated.View>

        {/* Signals List */}
        <View style={styles.signalsSection}>
          <Text style={styles.sectionLabel}>HISTORICAL SIGNALS</Text>

          {signals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No signals recorded yet. Trigger a test in settings to start your log.
              </Text>
            </View>
          ) : (
            signals.map((signal, index) => (
              <Animated.View
                key={signal.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
                style={styles.signalCard}
              >
                <View style={styles.signalContent}>
                  <View
                    style={[
                      styles.signalIcon,
                      { backgroundColor: `${getSignalColor(signal.type)}20` },
                    ]}
                  >
                    {getSignalIcon(signal.type)}
                  </View>
                  <View style={styles.signalDetails}>
                    <View style={styles.signalHeader}>
                      <Text style={[styles.signalType, { color: getSignalColor(signal.type) }]}>
                        {signal.type.toUpperCase()}
                        {signal.targetType === 'identity'
                          ? ' • FUTURE SELF'
                          : signal.targetIdentity && ` • ${signal.targetIdentity}`}
                      </Text>
                      <View style={styles.timeContainer}>
                        <Clock size={12} color={COLORS.mutedDark} />
                        <Text style={styles.timeText}>{formatTime(signal.timestamp)}</Text>
                      </View>
                    </View>
                    <Text style={styles.signalText}>{signal.text}</Text>
                  </View>
                </View>

                {/* Feedback Controls */}
                <View style={styles.feedbackRow}>
                  <Text style={styles.feedbackLabel}>TRAIN VOICE:</Text>
                  <View style={styles.feedbackButtons}>
                    <TouchableOpacity
                      onPress={() => updateSignalFeedback(signal.id, 'like')}
                      style={[
                        styles.feedbackButton,
                        signal.feedback === 'like' && styles.feedbackButtonLiked,
                      ]}
                    >
                      <ThumbsUp
                        size={16}
                        color={signal.feedback === 'like' ? COLORS.primary : COLORS.muted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateSignalFeedback(signal.id, 'dislike')}
                      style={[
                        styles.feedbackButton,
                        signal.feedback === 'dislike' && styles.feedbackButtonDisliked,
                      ]}
                    >
                      <ThumbsDown
                        size={16}
                        color={signal.feedback === 'dislike' ? COLORS.primary : COLORS.muted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </View>

        {/* Footer Message */}
        <View style={styles.footerMessage}>
          <Text style={styles.footerText}>
            YOUR FEEDBACK REFINES{'\n'}THE ALGORITHM OF YOUR BECOMING
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: SPACING.xxl,
  },

  // Info Card
  infoCard: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
    lineHeight: 22,
  },

  // Signals Section
  signalsSection: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedDark,
    letterSpacing: 4,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    paddingVertical: SPACING.xxl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.lg,
    color: COLORS.mutedDark,
    textAlign: 'center',
  },
  signalCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  signalContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  signalIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalDetails: {
    flex: 1,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  signalType: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    letterSpacing: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: COLORS.mutedDark,
    textTransform: 'uppercase',
  },
  signalText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.mutedLight,
    lineHeight: 24,
  },

  // Feedback
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  feedbackLabel: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: COLORS.mutedDark,
    letterSpacing: 2,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  feedbackButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackButtonLiked: {
    backgroundColor: COLORS.accent,
  },
  feedbackButtonDisliked: {
    backgroundColor: COLORS.error,
  },

  // Footer
  footerMessage: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedDark,
    letterSpacing: 5,
    textAlign: 'center',
    lineHeight: 20,
  },
});
