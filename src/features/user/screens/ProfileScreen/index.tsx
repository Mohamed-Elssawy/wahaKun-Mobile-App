import {
  ArrowRight,
  FileText,
  HelpCircle,
  Languages,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Bell as NotificationBell,
  Phone,
  User,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { resolveAttachmentUrl } from '@/features/reports/services/reportService';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, shadows, spacing } from '@/theme';

import { SettingsRow } from '../../components/SettingsRow';
import { SettingsSection } from '../../components/SettingsSection';
import { useProfile } from '../../hooks/useProfile';

const AVATAR_SIZE = 76;
const AVATAR_ICON = 32;
const BACK_ICON = 24;
const PIN_ICON = 16;

/** Neither toggle has anywhere to persist, so the row says so rather than implying sync. */
const DEVICE_ONLY = 'على هذا الجهاز فقط';

/** S-07. */
export default function ProfileScreen({ navigation }: ScreenProps<'Profile'>) {
  const insets = useSafeAreaInsets();
  const { user, preferences, isLoading, error, retry, togglePreference } = useProfile();

  const region = [user?.region, user?.village].filter(Boolean).join('، ');

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[12] }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={navigation.goBack}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
          >
            {/* Back is ArrowRight: directional icons follow the reading direction. */}
            <ArrowRight size={BACK_ICON} color={colors.textInverse} />
          </TouchableOpacity>

          <Text variant="h3" color="textInverse" align="right" style={styles.headerTitle}>
            الملف الشخصي
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.fallback}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.fallback}>
          <ReportErrorView
            error={error}
            unknownTitle="تعذر تحميل الملف الشخصي"
            onRetry={retry}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.identity}>
            {user?.picture ? (
              <Image
                source={{ uri: resolveAttachmentUrl(user.picture) }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <User size={AVATAR_ICON} color={colors.textMuted} />
              </View>
            )}

            <View style={styles.identityText}>
              <Text variant="h4" align="right">
                {user?.fullName || 'مزارع'}
              </Text>
              {region ? (
                <View style={styles.regionRow}>
                  <Text variant="label14" color="textSecondary" align="right">
                    {region}
                  </Text>
                  <MapPin size={PIN_ICON} color={colors.primary} />
                </View>
              ) : null}
            </View>
          </View>

          <SettingsSection title="الحساب">
            <SettingsRow
              icon={MapPin}
              label="تغيير المنطقة"
              value={region || undefined}
              onPress={() => navigation.navigate('Location')}
            />
            {/* No chevron: AuthService owns the number and offers no change endpoint. */}
            <SettingsRow icon={Phone} label="رقم الهاتف" value={user?.phoneNumber} />
          </SettingsSection>

          <SettingsSection title="الأمان و تسجيل الدخول">
            <SettingsRow
              icon={Mail}
              label="البريد الإلكتروني البديل"
              value={user?.email}
              onPress={() => navigation.navigate('EmailPassword')}
            />
            <SettingsRow
              icon={Lock}
              label="تغيير كلمة المرور"
              // There is no authenticated change-password endpoint, only the email link.
              onPress={() =>
                navigation.navigate('ForgotPassword', { email: user?.email })
              }
            />
          </SettingsSection>

          <SettingsSection title="إعدادات التطبيق">
            <SettingsRow
              icon={Languages}
              label="اللغة"
              value="العربية"
              note="لا تتوفر لغات أخرى بعد"
            />
            <SettingsRow
              icon={NotificationBell}
              label="تنبيهات المنطقة الحرجة"
              note={DEVICE_ONLY}
              toggle={{
                isOn: preferences?.criticalArea ?? true,
                onChange: () => togglePreference('criticalArea'),
              }}
            />
            <SettingsRow
              icon={MessageCircle}
              label="إشعارات التعليقات"
              note={DEVICE_ONLY}
              toggle={{
                isOn: preferences?.comments ?? true,
                onChange: () => togglePreference('comments'),
              }}
            />
          </SettingsSection>

          <SettingsSection title="الدعم">
            <SettingsRow
              icon={HelpCircle}
              label="مركز المساعدة"
              onPress={() => navigation.navigate('TermsOfUse')}
            />
            <SettingsRow
              icon={FileText}
              label="شروط الاستخدام وسياسة الخصوصية"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
          </SettingsSection>

          <View style={styles.logoutCard}>
            <SettingsRow
              icon={LogOut}
              label="تسجيل الخروج"
              tone="error"
              onPress={() =>
                navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })
              }
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[24],
  },
  // Plain row, matching the frame: back sits at the left edge, title right-aligned.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: screenPadding,
    gap: spacing[24],
  },
  identity: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
    padding: spacing[16],
    borderRadius: radii[12],
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  avatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    flex: 1,
    gap: spacing[4],
  },
  regionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
  logoutCard: {
    backgroundColor: colors.surface,
    borderRadius: radii[12],
    overflow: 'hidden',
    ...shadows.card,
  },
});
