import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>Last updated: January 2026</Text>

        <Text style={styles.intro}>
          Becoming ("we," "our," or "us") respects your privacy and is committed to protecting your
          personal data.
        </Text>

        <Text style={styles.sectionTitle}>1. Data We Collect</Text>
        <Text style={styles.sectionText}>
          • Account information (email, password){'\n'}
          • Goals and identity statements you create{'\n'}
          • Check-in responses and reflections{'\n'}
          • Evolution signals and feedback{'\n'}
          • Notification preferences
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
        <Text style={styles.sectionText}>
          • Provide and improve the Becoming app{'\n'}
          • Generate personalized AI-powered insights{'\n'}
          • Send scheduled notifications{'\n'}
          • Sync your data across devices{'\n'}
          • Communicate with you about your account
        </Text>

        <Text style={styles.sectionTitle}>3. Data Sharing</Text>
        <Text style={styles.sectionText}>
          We do not sell your personal data. We share data only with:{'\n'}
          • OpenAI (for AI-powered features){'\n'}
          • Service providers who help operate our app{'\n'}
          {'\n'}
          Your data is transmitted securely and stored encrypted.
        </Text>

        <Text style={styles.sectionTitle}>4. Your Rights</Text>
        <Text style={styles.sectionText}>
          • Access your data at any time in the app{'\n'}
          • Delete your account and all data in Settings{'\n'}
          • Opt out of notifications in Settings{'\n'}
          • Contact us at zsottomayor@gmail.com for questions
        </Text>

        <Text style={styles.sectionTitle}>5. Data Security</Text>
        <Text style={styles.sectionText}>
          We use industry-standard encryption (HTTPS, JWT tokens) to protect your data. However, no
          method of transmission is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
        <Text style={styles.sectionText}>
          Becoming is not intended for users under 13. We do not knowingly collect data from
          children.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact Us</Text>
        <Text style={styles.sectionText}>
          For privacy questions or requests:{'\n'}
          Email: zsottomayor@gmail.com{'\n'}
          We will respond within 30 days.
        </Text>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  lastUpdated: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  intro: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
});
