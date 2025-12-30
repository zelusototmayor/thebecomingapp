import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Lock, KeyRound, Check, X, CheckCircle, XCircle } from 'lucide-react-native';
import Logo from '../components/Logo';
import GradientButton from '../components/GradientButton';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import { authApi } from '../lib/api';

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  const pulseOpacity = useSharedValue(0.1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setIsValidating(false);
      setIsTokenValid(false);
    }
  }, [token]);

  useEffect(() => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  }, [password]);

  const validateToken = async () => {
    try {
      const response = await authApi.verifyResetToken(token as string);
      setIsTokenValid(response.valid);
    } catch {
      setIsTokenValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const blobStyle1 = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const blobStyle2 = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value * 0.8,
  }));

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isFormValid = isPasswordValid && passwordsMatch;

  const handleReset = async () => {
    if (!isFormValid || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword(token as string, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordCheck = ({ valid, label }: { valid: boolean; label: string }) => (
    <View style={styles.passwordCheck}>
      {valid ? (
        <Check size={14} color={COLORS.accent} />
      ) : (
        <X size={14} color={COLORS.mutedDark} />
      )}
      <Text style={[styles.passwordCheckText, valid && styles.passwordCheckValid]}>
        {label}
      </Text>
    </View>
  );

  // Loading state
  if (isValidating) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.blob, styles.blob1, blobStyle1]} />
        <Animated.View style={[styles.blob, styles.blob2, blobStyle2]} />
        <View style={styles.content}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Validating reset link...</Text>
        </View>
      </View>
    );
  }

  // Invalid token state
  if (!isTokenValid) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.blob, styles.blob1, blobStyle1]} />
        <Animated.View style={[styles.blob, styles.blob2, blobStyle2]} />
        <View style={styles.content}>
          <View style={styles.errorIconContainer}>
            <XCircle size={48} color="#ef4444" />
          </View>
          <Text style={styles.errorTitle}>Invalid or Expired Link</Text>
          <Text style={styles.errorMessage}>
            This password reset link is invalid or has expired. Please request a new one.
          </Text>
          <GradientButton
            onPress={() => router.replace('/forgot-password')}
            style={styles.submitButton}
          >
            Request New Link
          </GradientButton>
        </View>
      </View>
    );
  }

  // Success state
  if (success) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.blob, styles.blob1, blobStyle1]} />
        <Animated.View style={[styles.blob, styles.blob2, blobStyle2]} />
        <View style={styles.content}>
          <View style={styles.successIconContainer}>
            <CheckCircle size={48} color={COLORS.accent} />
          </View>
          <Text style={styles.successTitle}>Password Reset!</Text>
          <Text style={styles.successMessage}>
            Your password has been successfully reset. You can now log in with your new password.
          </Text>
          <GradientButton
            onPress={() => router.replace('/login')}
            style={styles.submitButton}
          >
            Go to Login
          </GradientButton>
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
          New Password
        </Animated.Text>

        <Animated.Text entering={FadeIn.delay(400).duration(800)} style={styles.tagline}>
          Create a strong password for your account
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.formContainer}
        >
          {error && (
            <View style={styles.formErrorContainer}>
              <Text style={styles.formErrorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={COLORS.mutedDark} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={COLORS.mutedDark}
                secureTextEntry
                autoFocus
              />
            </View>

            <View style={styles.passwordStrength}>
              <PasswordCheck valid={passwordStrength.hasMinLength} label="8+ characters" />
              <PasswordCheck valid={passwordStrength.hasUppercase} label="Uppercase" />
              <PasswordCheck valid={passwordStrength.hasLowercase} label="Lowercase" />
              <PasswordCheck valid={passwordStrength.hasNumber} label="Number" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <View style={[
              styles.inputWrapper,
              confirmPassword && !passwordsMatch && styles.inputWrapperError
            ]}>
              <KeyRound size={20} color={COLORS.mutedDark} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor={COLORS.mutedDark}
                secureTextEntry
              />
            </View>
            {confirmPassword && !passwordsMatch && (
              <Text style={styles.mismatchText}>Passwords do not match</Text>
            )}
          </View>

          <GradientButton
            onPress={handleReset}
            disabled={isLoading || !isFormValid}
            loading={isLoading}
            style={styles.submitButton}
            icon={<KeyRound size={20} color={COLORS.primary} />}
          >
            Reset Password
          </GradientButton>
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
  loadingText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
    marginTop: SPACING.lg,
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
  formErrorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  formErrorText: {
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
  inputWrapperError: {
    borderColor: '#ef4444',
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
  passwordStrength: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  passwordCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  passwordCheckText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedDark,
  },
  passwordCheckValid: {
    color: COLORS.accent,
  },
  mismatchText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: '#ef4444',
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  errorTitle: {
    fontFamily: FONTS.serifBold,
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  errorMessage: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: 300,
    lineHeight: 24,
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
});
