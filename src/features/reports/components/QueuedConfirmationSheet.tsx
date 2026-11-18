import { CloudOff, CloudUpload } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radii, screenPadding, shadows, spacing } from '@/theme';

const CIRCLE_SIZE = 100;
const ICON_SIZE = 44;
const NOTICE_ICON_SIZE = 24;

export type QueuedConfirmationSheetProps = {
  onViewReports: () => void;
};

/** X-02a. A plain panel, not a bottom-sheet: nothing here is draggable or dismissible. */
export function QueuedConfirmationSheet({ onViewReports }: QueuedConfirmationSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.sheet, { paddingBottom: insets.bottom + spacing[24] }]}
      accessibilityRole="alert"
    >
      <View style={styles.circle}>
        <CloudUpload size={ICON_SIZE} color={colors.primary} />
      </View>

      <View style={styles.text}>
        <Text variant="h4" align="center">
          {t('x02a.savedTitle')}
        </Text>
        <Text variant="label14" color="textSecondary" align="center">
          {t('x02a.nothingToDo')}
        </Text>
      </View>

      <View style={styles.notice}>
        <CloudOff size={NOTICE_ICON_SIZE} color={colors.primary} />
        <Text variant="label12" color="primaryPressed" style={styles.noticeText}>
          {t('x02a.savedBody')}
        </Text>
      </View>

      <Button label={t('x02a.viewAll')} onPress={onViewReports} showArrow />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: spacing[16],
    paddingTop: spacing[32],
    paddingHorizontal: screenPadding,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii[20],
    borderTopRightRadius: radii[20],
    ...shadows.sheet,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    alignItems: 'center',
    gap: spacing[4],
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing[12],
    padding: spacing[12],
    borderRadius: radii[12],
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primaryTint,
  },
  noticeText: {
    flex: 1,
  },
});
