import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { Mail, Lock, User, ChevronLeft, UserPlus, Check, X } from 'lucide-react-native';
import Logo from '../components/Logo';
import GradientButton from '../components/GradientButton';
import { useApp } from '../context/AppContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import { authApi } from '../lib/api';
import { storeTokens } from '../lib/auth';

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { handleLogin } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  }, [password]);

  const blobStyle1 = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const blobStyle2 = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value * 0.8,
  }));

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);
  const isFormValid = name.trim() && email.trim() && isPasswordValid;

  const handleRegister = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(email.trim().toLowerCase(), password, name.trim());

      await storeTokens(response.tokens.accessToken, response.tokens.refreshToken);

      handleLogin({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        photoUrl: response.user.photoUrl,
        provider: response.user.provider as 'email' | 'google',
      });

      router.replace('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.blob, styles.blob1, blobStyle1]} />
      <Animated.View style={[styles.blob, styles.blob2, blobStyle2]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn.duration(1000)} style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Logo size={40} animated={isLoading} />
            </View>
          </Animated.View>

          <Animated.Text entering={FadeIn.delay(200).duration(800)} style={styles.title}>
            Create Account
          </Animated.Text>

          <Animated.Text entering={FadeIn.delay(400).duration(800)} style={styles.tagline}>
            Begin your journey of becoming
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
              <Text style={styles.inputLabel}>NAME</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color={COLORS.mutedDark} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.mutedDark}
                  autoCapitalize="words"
                />
              </View>
            </View>

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
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color={COLORS.mutedDark} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={COLORS.mutedDark}
                  secureTextEntry
                />
              </View>

              <View style={styles.passwordStrength}>
                <PasswordCheck valid={passwordStrength.hasMinLength} label="8+ characters" />
                <PasswordCheck valid={passwordStrength.hasUppercase} label="Uppercase" />
                <PasswordCheck valid={passwordStrength.hasLowercase} label="Lowercase" />
                <PasswordCheck valid={passwordStrength.hasNumber} label="Number" />
              </View>
            </View>

            <GradientButton
              onPress={handleRegister}
              disabled={isLoading || !isFormValid}
              loading={isLoading}
              style={styles.submitButton}
              icon={<UserPlus size={20} color={COLORS.primary} />}
            >
              Create Account
            </GradientButton>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={16} color={COLORS.muted} />
              <Text style={styles.backButtonText}>Back to login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
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
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.lg,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
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
});
