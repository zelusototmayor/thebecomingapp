import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  Clock,
  Calendar,
  Trash2,
  Check,
  LogOut,
  User as UserIcon,
  Smartphone,
  Send,
  ChevronRight,
} from 'lucide-react-native';
import Logo from '../components/Logo';
import GradientButton from '../components/GradientButton';
import { useApp } from '../context/AppContext';
import { generateEvolutionSignal } from '../lib/ai';
import { Signal, Tone } from '../types';
import { generateId } from '../lib/storage';
import { NOTIFICATION_TEMPLATES } from '../lib/messages';
import { sendImmediateNotification } from '../lib/notifications';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, GRADIENT } from '../constants/theme';
import { getTokens, clearTokens } from '../lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FREQUENCY_OPTIONS = [
  { value: 2 as const, label: '2x / week' },
  { value: 3 as const, label: '3x / week' },
  { value: 7 as const, label: 'Daily' },
];
const TONE_OPTIONS: Tone[] = ['gentle', 'direct', 'motivational'];

export default function SettingsScreen() {
  const { state, updateSettings, addSignal, handleLogout, resetAllData } = useApp();
  const { settings, user, goals, signals } = state;
  const [previewMsgIndex, setPreviewMsgIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Convert "HH:MM" string to Date object
  const getTimeAsDate = () => {
    const [hours, minutes] = settings.notificationTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      updateSettings({ ...settings, notificationTime: `${hours}:${minutes}` });
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const toggleDay = (day: string) => {
    const newDays = settings.notificationDays.includes(day)
      ? settings.notificationDays.filter((d) => d !== day)
      : [...settings.notificationDays, day];
    updateSettings({ ...settings, notificationDays: newDays });
  };

  const handleReset = () => {
    Alert.alert(
      'Delete Evolution Data',
      'Erase all becoming progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const cyclePreview = () => {
    const templates = NOTIFICATION_TEMPLATES[settings.notificationTone];
    setPreviewMsgIndex((previewMsgIndex + 1) % templates.length);
  };

  const currentPreviewText = NOTIFICATION_TEMPLATES[settings.notificationTone][previewMsgIndex]
    ?.replace(/{identity}/g, 'Future Self') || 'Loading preview...';

  const handleTriggerSignal = async () => {
    if (goals.length === 0 && !state.mainMission) {
      Alert.alert('No Goals', 'Add at least one goal to generate signals.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateEvolutionSignal(goals, state.mainMission, settings.notificationTone, signals);
      const newSignal: Signal = {
        id: generateId(),
        text: result.text,
        timestamp: Date.now(),
        type: result.type,
        feedback: 'none',
        targetType: result.targetType,
        targetIdentity: result.targetIdentity,
      };
      addSignal(newSignal);

      // Send real push notification instead of Alert.alert
      await sendImmediateNotification(
        'The Becoming',
        result.text,
        { signalId: newSignal.id, type: 'triggered_signal' }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate signal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const onLogoutPress = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          handleLogout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      const tokens = await getTokens();
      if (!tokens) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      const response = await fetch(`${CONFIG.apiUrl}/api/user/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Clear local data
      await clearTokens();
      await AsyncStorage.clear();

      // Redirect to login
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.muted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evolution</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Phone Mockup Preview */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Smartphone size={16} color={COLORS.muted} />
            <Text style={styles.sectionLabel}>SIGNAL PREVIEW</Text>
          </View>

          <TouchableOpacity onPress={cyclePreview} activeOpacity={0.9}>
            <View style={styles.phoneFrame}>
              <View style={styles.phoneScreen}>
                {/* Time display */}
                <View style={styles.phoneTimeSection}>
                  <Text style={styles.phoneTime}>10:00</Text>
                  <Text style={styles.phoneDate}>Monday, May 22</Text>
                </View>

                {/* Notification */}
                <View style={styles.notificationCard}>
                  <View style={styles.notificationHeader}>
                    <LinearGradient
                      colors={GRADIENT.colors}
                      start={GRADIENT.start}
                      end={GRADIENT.end}
                      style={styles.notificationIcon}
                    >
                      <Logo size={10} />
                    </LinearGradient>
                    <Text style={styles.notificationAppName}>BECOMING</Text>
                    <Text style={styles.notificationTime}>now</Text>
                  </View>
                  <Text style={styles.notificationText}>{currentPreviewText}</Text>
                </View>

                {/* Home indicator */}
                <View style={styles.homeIndicator} />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.previewHint}>TAP MOCKUP TO SEE LEGACY SIGNALS</Text>

          <TouchableOpacity
            style={[styles.triggerButton, isGenerating && styles.triggerButtonDisabled]}
            onPress={handleTriggerSignal}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color={COLORS.mutedLight} />
                <Text style={styles.triggerButtonText}>AI is generating Signal...</Text>
              </>
            ) : (
              <>
                <Send size={16} color={COLORS.mutedLight} />
                <Text style={styles.triggerButtonText}>Trigger Live AI Signal</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* User Profile */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.userCard}>
          <View style={styles.userInfo}>
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <UserIcon size={24} color={COLORS.muted} />
              </View>
            )}
            <View>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userProvider}>
                ORIGIN: {user?.provider?.toUpperCase() || 'EMAIL'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress}>
            <LogOut size={20} color={COLORS.error} />
          </TouchableOpacity>
        </Animated.View>

        {/* Signal Density */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={16} color={COLORS.muted} />
            <Text style={styles.sectionLabel}>SIGNAL DENSITY</Text>
          </View>
          <View style={styles.frequencyRow}>
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.frequencyButton,
                  settings.notificationFrequency === option.value && styles.frequencyButtonActive,
                ]}
                onPress={() => updateSettings({ ...settings, notificationFrequency: option.value })}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    settings.notificationFrequency === option.value &&
                      styles.frequencyButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Reminders Tone */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={16} color={COLORS.muted} />
            <Text style={styles.sectionLabel}>REMINDERS TONE</Text>
          </View>
          <View style={styles.toneList}>
            {TONE_OPTIONS.map((tone) => (
              <TouchableOpacity
                key={tone}
                style={[
                  styles.toneButton,
                  settings.notificationTone === tone && styles.toneButtonActive,
                ]}
                onPress={() => updateSettings({ ...settings, notificationTone: tone })}
              >
                <Text
                  style={[
                    styles.toneButtonText,
                    settings.notificationTone === tone && styles.toneButtonTextActive,
                  ]}
                >
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </Text>
                {settings.notificationTone === tone && (
                  <Check size={16} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Signal Time */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <TouchableOpacity
            style={styles.timeCard}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.timeRow}>
              <View style={styles.sectionHeader}>
                <Clock size={16} color={COLORS.muted} />
                <Text style={styles.sectionLabel}>SIGNAL TIME</Text>
              </View>
              <View style={styles.timeValueRow}>
                <Text style={styles.timeValue}>{settings.notificationTime}</Text>
                <ChevronRight size={20} color={COLORS.muted} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Time Picker */}
        {showTimePicker && (
          <View style={styles.timePickerContainer}>
            {Platform.OS === 'ios' && (
              <View style={styles.timePickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.timePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
            <DateTimePicker
              value={getTimeAsDate()}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              textColor={COLORS.primary}
              themeVariant="dark"
            />
          </View>
        )}

        {/* Active Days */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={16} color={COLORS.muted} />
            <Text style={styles.sectionLabel}>ACTIVE DAYS</Text>
          </View>
          <View style={styles.daysRow}>
            {DAYS.map((day) => {
              const isSelected = settings.notificationDays.includes(day);
              return isSelected ? (
                <LinearGradient
                  key={day}
                  colors={GRADIENT.colors}
                  start={GRADIENT.start}
                  end={GRADIENT.end}
                  style={styles.dayButton}
                >
                  <TouchableOpacity
                    style={styles.dayButtonInner}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={styles.dayButtonTextActive}>{day[0]}</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={day}
                  style={styles.dayButtonInactive}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={styles.dayButtonText}>{day[0]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Privacy Policy */}
        <View style={styles.policySection}>
          <TouchableOpacity
            onPress={() => router.push('/privacy-policy')}
            style={styles.policyButton}
          >
            <View>
              <Text style={styles.policyTitle}>Privacy Policy</Text>
              <Text style={styles.policySubtitle}>How we handle your data</Text>
            </View>
            <ChevronRight size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Delete Data */}
        <View style={styles.deleteSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleReset}>
            <Trash2 size={12} color={COLORS.errorMuted} />
            <Text style={styles.deleteButtonText}>Delete Evolution Data</Text>
          </TouchableOpacity>
        </View>

        {/* Account Management */}
        <View style={styles.accountSection}>
          <Text style={styles.accountSectionLabel}>ACCOUNT MANAGEMENT</Text>
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            style={styles.deleteAccountButton}
          >
            <Text style={styles.deleteAccountTitle}>Delete Account</Text>
            <Text style={styles.deleteAccountSubtitle}>
              Permanently delete your account and all data
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalMessage}>
              This will permanently delete your account, goals, check-ins, and all associated
              data. This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={isDeleting}
                style={[styles.modalDeleteButton, isDeleting && styles.modalDeleteButtonDisabled]}
              >
                <Text style={styles.modalDeleteText}>
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <GradientButton onPress={() => router.back()}>
          Update Evolution Path
        </GradientButton>
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
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    letterSpacing: 3,
  },

  // Phone Mockup
  phoneFrame: {
    backgroundColor: COLORS.card,
    borderWidth: 6,
    borderColor: '#252f4a',
    borderRadius: 48,
    width: 240,
    aspectRatio: 9 / 16,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#0c1426',
    paddingTop: 48,
  },
  phoneTimeSection: {
    alignItems: 'center',
  },
  phoneTime: {
    fontFamily: FONTS.regular,
    fontSize: 48,
    color: COLORS.primary,
    letterSpacing: -2,
  },
  phoneDate: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 1,
    marginTop: 2,
  },
  notificationCard: {
    position: 'absolute',
    top: '35%',
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notificationIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationAppName: {
    fontFamily: FONTS.bold,
    fontSize: 8,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },
  notificationTime: {
    fontFamily: FONTS.regular,
    fontSize: 6,
    color: 'rgba(255,255,255,0.4)',
    marginLeft: 'auto',
    textTransform: 'uppercase',
  },
  notificationText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.primary,
    lineHeight: 15,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -16,
    width: 32,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  previewHint: {
    fontFamily: FONTS.bold,
    fontSize: 8,
    color: COLORS.mutedDark,
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
  },
  triggerButtonDisabled: {
    opacity: 0.8,
  },
  triggerButtonText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedLight,
  },

  // User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  userProvider: {
    fontFamily: FONTS.bold,
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 1,
    marginTop: 2,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Frequency
  frequencyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: 'rgba(20, 184, 166, 0.5)',
  },
  frequencyButtonText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
  },
  frequencyButtonTextActive: {
    color: COLORS.primary,
  },

  // Tone
  toneList: {
    gap: SPACING.sm,
  },
  toneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toneButtonActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderColor: COLORS.accent,
  },
  toneButtonText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
  },
  toneButtonTextActive: {
    color: COLORS.primary,
  },

  // Time
  timeCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  timeValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  timePickerContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  timePickerDone: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
  },

  // Days
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
  },
  dayButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonInactive: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.mutedDark,
  },
  dayButtonTextActive: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.primary,
  },

  // Delete
  deleteSection: {
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  deleteButtonText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.errorMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Privacy Policy
  policySection: {
    marginBottom: SPACING.xl,
  },
  policyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  policyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  policySubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Account Management
  accountSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  accountSectionLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  deleteAccountButton: {
    padding: SPACING.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteAccountTitle: {
    color: '#ef4444',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.bold,
  },
  deleteAccountSubtitle: {
    color: '#ef4444',
    opacity: 0.7,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalMessage: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.cardElevated,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.bold,
  },
  modalDeleteButton: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: '#ef4444',
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
  },
  modalDeleteButtonDisabled: {
    opacity: 0.5,
  },
  modalDeleteText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.bold,
  },

  // Footer
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
});
