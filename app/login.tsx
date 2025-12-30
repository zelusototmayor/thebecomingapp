import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
import { Mail, Lock, ChevronLeft, LogIn } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../components/Logo';
import GradientButton from '../components/GradientButton';
import { useApp } from '../context/AppContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, GRADIENT } from '../constants/theme';
import { generateId } from '../lib/storage';
import { authApi } from '../lib/api';
import { storeTokens } from '../lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { handleLogin, state } = useApp();
  const [mode, setMode] = useState<'selection' | 'email'>('selection');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Animated background blobs
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

  // TODO: Implement Google OAuth in the future
  const simulateGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleLogin({
        id: generateId(),
        email: 'traveler@gmail.com',
        name: 'Alex Johnson',
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        provider: 'google',
      });
      setIsLoading(false);
      if (state.settings.hasOnboarded) {
        router.replace('/home');
      } else {
        router.replace('/onboarding');
      }
    }, 1500);
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(email.trim().toLowerCase(), password);

      await storeTokens(response.tokens.accessToken, response.tokens.refreshToken);

      handleLogin({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        photoUrl: response.user.photoUrl,
        provider: response.user.provider as 'email' | 'google',
      });

      if (state.settings.hasOnboarded) {
        router.replace('/home');
      } else {
        router.replace('/onboarding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background blobs */}
      <Animated.View style={[styles.blob, styles.blob1, blobStyle1]} />
      <Animated.View style={[styles.blob, styles.blob2, blobStyle2]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Animated.View entering={FadeIn.duration(1000)} style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Logo size={48} animated={isLoading} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(200).duration(800)} style={styles.title}>
          The Becoming App
        </Animated.Text>

        <Animated.Text entering={FadeIn.delay(400).duration(800)} style={styles.tagline}>
          Become who you were meant to be.
        </Animated.Text>

        {mode === 'selection' ? (
          <Animated.View
            entering={FadeInDown.delay(600).duration(500)}
            style={styles.buttonContainer}
          >
            <TouchableOpacity
              style={styles.googleButton}
              onPress={simulateGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#18181b" size="small" />
              ) : (
                <>
                  <GoogleIcon />
                  <Text style={styles.googleButtonText}>Join with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emailButton}
              onPress={() => setMode('email')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Mail size={20} color={COLORS.primary} />
              <Text style={styles.emailButtonText}>Continue with Email</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(300)}
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color={COLORS.mutedDark} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.mutedDark}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push('/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <GradientButton
              onPress={handleEmailLogin}
              disabled={isLoading || !email || !password}
              loading={isLoading}
              style={styles.submitButton}
              icon={<LogIn size={20} color={COLORS.primary} />}
            >
              Sign In
            </GradientButton>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>Create one</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setMode('selection')}
            >
              <ChevronLeft size={16} color={COLORS.muted} />
              <Text style={styles.backButtonText}>Go back</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.Text
          entering={FadeIn.delay(800).duration(800)}
          style={styles.footer}
        >
          THE JOURNEY TO YOUR FUTURE SELF
        </Animated.Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const GoogleIcon = () => (
  <View style={{ width: 20, height: 20, marginRight: 4 }}>
    <Text style={{ fontSize: 18 }}>G</Text>
  </View>
);

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
    marginBottom: SPACING.xl,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: BORDER_RADIUS.xxxl,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.serifBold,
    fontSize: FONT_SIZES.display,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.lg,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 340,
    gap: SPACING.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  googleButtonText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: '#18181b',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  emailButtonText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
  },
  forgotPasswordText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  registerText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
  },
  registerLink: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
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
  footer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedDark,
    letterSpacing: 3,
    opacity: 0.5,
  },
});
