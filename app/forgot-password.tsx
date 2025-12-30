import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Mail, ChevronLeft, Send, CheckCircle } from 'lucide-react-native';
import Logo from '../components/Logo';
import GradientButton from '../components/GradientButton';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import { authApi } from '../lib/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const pulseOpacity = useSharedValue(0.1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const blobStyle1 = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const blobStyle2 = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value * 0.8,
  }));

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    if (!isEmailValid) return;

    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.blob, styles.blob1, blobStyle1]} />
        <Animated.View style={[styles.blob, styles.blob2, blobStyle2]} />

        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={48} color={COLORS.accent} />
            </View>

            <Text style={styles.successTitle}>Check your email</Text>

            <Text style={styles.successMessage}>
              If an account exists for {email}, we've sent password reset instructions.
            </Text>

            <GradientButton
              onPress={() => router.replace('/login')}
              style={styles.submitButton}
            >
              Back to Login
            </GradientButton>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setSent(false);
                setEmail('');
              }}
            >
              <Text style={styles.resendButtonText}>Try a different email</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.blob, styles.blob1, blobStyle1]} />
      <Animated.View style={[styles.blob, styles.blob2, blobStyle2]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Animated.View entering={FadeIn.duration(1000)} style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Logo size={40} animated={isLoading} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(200).duration(800)} style={styles.title}>
          Reset Password
        </Animated.Text>

        <Animated.Text entering={FadeIn.delay(400).duration(800)} style={styles.tagline}>
          Enter your email to receive reset instructions
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.formContainer}
        >
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={COLORS.mutedDark} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={COLORS.mutedDark}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
            </View>
          </View>

          <GradientButton
            onPress={handleSubmit}
            disabled={isLoading || !isEmailValid}
            loading={isLoading}
            style={styles.submitButton}
            icon={<Send size={20} color={COLORS.primary} />}
          >
            Send Reset Link
          </GradientButton>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={16} color={COLORS.muted} />
            <Text style={styles.backButtonText}>Back to login</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  blob: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    borderRadius: 9999,
  },
  blob1: {
    top: '-10%',
    left: '-10%',
    backgroundColor: COLORS.accent,
  },
  blob2: {
    bottom: '-10%',
    right: '-10%',
    backgroundColor: COLORS.accentSecondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  logoContainer: {
    marginBottom: SPACING.lg,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xxxl,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.serifBold,
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: 280,
  },
  formContainer: {
    width: '100%',
    maxWidth: 340,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: '#ef4444',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  inputIcon: {
    marginLeft: SPACING.md,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  backButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  successTitle: {
    fontFamily: FONTS.serifBold,
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  successMessage: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: 300,
    lineHeight: 24,
  },
  resendButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  resendButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
  },
});
