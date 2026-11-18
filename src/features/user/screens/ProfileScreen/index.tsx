import {
  FilePlus2,
  FileText,
  HelpCircle,
  Languages,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Bell as NotificationBell,
  Pencil,
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

import { LanguageDialog, Text } from '@/components/ui';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { toNationalDisplay } from '@/features/auth/phoneNumber';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import { isRTL, ltrIsolate, t } from '@/i18n';
import { BackIcon } from '@/i18n/icons';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, shadows, spacing } from '@/theme';

import { SettingsRow } from '../../components/SettingsRow';
import { SettingsSection } from '../../components/SettingsSection';
import { useProfile } from '../../hooks/useProfile';
import { resolveRole } from '../../role';
import { resolveProfilePictureUrl } from '../../services/userService';

const AVATAR_SIZE = 76;
const AVATAR_ICON = 32;
const BADGE_SIZE = 20;
const BADGE_ICON = 12;
const BACK_ICON = 24;
const PIN_ICON = 16;

/** Neither toggle has anywhere to persist, so the row says so rather than implying sync. */

/** S-07. */
export default function ProfileScreen({ navigation }: ScreenProps<'Profile'>) {
  const insets = useSafeAreaInsets();
  const { user, preferences, isLoading, error, retry, togglePreference } = useProfile();
  const logout = useLogout();
  const language = useLanguageSwitch();

  const region = [user?.region, user?.village]
    .filter(Boolean)
    .join(t('common.listSeparator'));
  const isExpert = resolveRole(user).role === 'expert';
  // Branches on the resolved url, not on `picture`: a key storage cannot serve is not an avatar.
  const avatarUrl = user?.picture ? resolveProfilePictureUrl(user.picture) : undefined;

  const handleLogout = async () => {
    // Clear the session before leaving, so the queue cannot upload under it afterward.
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[12] }]}>
        {/* G-01, green header: back takes the end edge, so the title leads and it trails. */}
        <View style={styles.headerRow}>
          <Text variant="h3" color="textInverse" style={styles.headerTitle}>
            {t('common.profile')}
          </Text>

          <TouchableOpacity
            onPress={navigation.goBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <BackIcon size={BACK_ICON} color={colors.textInverse} />
          </TouchableOpacity>
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
            unknownTitle={t('s07.loadErrorTitle')}
            onRetry={retry}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.identity}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditProfilePicture')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('s07.changePhoto')}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <User size={AVATAR_ICON} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Pencil size={BADGE_ICON} color={colors.textInverse} />
              </View>
            </TouchableOpacity>

            <View style={styles.identityText}>
              {/* Not s05.roleFarmer (told an expert they were a farmer) or common.unknownAuthor (third-person, wrong for a viewer's own profile). */}
              <Text variant="h4">{user?.fullName || t('s07.noName')}</Text>
              {region ? (
                <View style={styles.regionRow}>
                  <Text variant="label14" color="textSecondary">
                    {region}
                  </Text>
                  <MapPin size={PIN_ICON} color={colors.primary} />
                </View>
              ) : null}
            </View>
          </View>

          <SettingsSection title={t('s07.sectionAccount')}>
            <SettingsRow
              icon={MapPin}
              label={t('s07.changeArea')}
              value={region || undefined}
              onPress={() => navigation.navigate('EditRegion')}
            />
            {/* No chevron: AuthService owns the number and offers no change endpoint. */}
            <SettingsRow
              icon={Phone}
              label={t('common.phoneNumber')}
              // C26: the local form the owner would write, not the wire's E.164.
              value={
                user?.phoneNumber
                  ? ltrIsolate(toNationalDisplay(user.phoneNumber))
                  : undefined
              }
            />
          </SettingsSection>

          <SettingsSection title={t('s07.sectionSecurity')}>
            <SettingsRow
              icon={Mail}
              label={t('s07.altEmail')}
              value={user?.email ? ltrIsolate(user.email) : undefined}
              onPress={() => navigation.navigate('EmailPassword')}
            />
            <SettingsRow
              icon={Lock}
              label={t('s11.title')}
              // There is no authenticated change-password endpoint, only the email link.
              onPress={() =>
                navigation.navigate('ForgotPassword', { email: user?.email })
              }
            />
          </SettingsSection>

          <SettingsSection title={t('s07.sectionApp')}>
            <SettingsRow
              icon={Languages}
              label={t('s07.language')}
              value={t('s07.languageValue')}
              onPress={language.open}
            />
            {isExpert ? (
              <>
                <SettingsRow
                  icon={NotificationBell}
                  label={t('s07.notifyLongWait')}
                  note={t('s07.deviceOnly')}
                  toggle={{
                    isOn: preferences?.longWait ?? true,
                    onChange: () => togglePreference('longWait'),
                  }}
                />
                <SettingsRow
                  icon={FilePlus2}
                  label={t('s07.notifyNewCases')}
                  note={t('s07.deviceOnly')}
                  toggle={{
                    isOn: preferences?.newCase ?? true,
                    onChange: () => togglePreference('newCase'),
                  }}
                />
              </>
            ) : (
              <SettingsRow
                icon={NotificationBell}
                label={t('s07.notifyCriticalArea')}
                note={t('s07.deviceOnly')}
                toggle={{
                  isOn: preferences?.criticalArea ?? true,
                  onChange: () => togglePreference('criticalArea'),
                }}
              />
            )}
            <SettingsRow
              icon={MessageCircle}
              label={t('s07.notifyComments')}
              note={t('s07.deviceOnly')}
              toggle={{
                isOn: preferences?.comments ?? true,
                onChange: () => togglePreference('comments'),
              }}
            />
          </SettingsSection>

          <SettingsSection title={t('s07.sectionSupport')}>
            <SettingsRow
              icon={HelpCircle}
              label={t('s07.helpCentre')}
              onPress={() => navigation.navigate('TermsOfUse')}
            />
            <SettingsRow
              icon={FileText}
              label={t('s07.legal')}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
          </SettingsSection>

          <View style={styles.logoutCard}>
            <SettingsRow
              icon={LogOut}
              label={t('s07.logOut')}
              tone="error"
              onPress={handleLogout}
            />
          </View>
        </ScrollView>
      )}

      {/* S-12: a dialog over S-07, not a route, shared with the pre-login control. */}
      <LanguageDialog
        isVisible={language.isOpen}
        active={language.active}
        selected={language.selected}
        onSelect={language.select}
        onConfirm={language.confirm}
        onDismiss={language.dismiss}
        isApplying={language.state === 'applying'}
        error={language.error}
      />
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
  // C24: a column, not a row. Both S-07 frames centre the avatar and set the name beneath it.
  identity: {
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
  avatarBadge: {
    position: 'absolute',
    // C83: bottom-RIGHT in both locales; `right` wouldn't do it since RN swaps left/right under RTL.
    ...(isRTL() ? { start: 0 } : { end: 0 }),
    bottom: 0,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    alignItems: 'center',
    gap: spacing[4],
  },
  regionRow: {
    flexDirection: 'row',
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
