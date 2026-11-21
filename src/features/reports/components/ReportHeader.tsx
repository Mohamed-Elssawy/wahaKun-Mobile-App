import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { BackIcon } from '@/i18n/icons';
import { colors, screenPadding, spacing } from '@/theme';

import type { ReactNode } from 'react';

export type ReportHeaderProps = {
  title: string;
  subtitle?: string;
  /** Omitted by My Issues, which is a tab and has nowhere to go back to. */
  onBack?: () => void;
  /** C34: X-02 keeps the chevron visible but inert while the model runs, unlike omitting onBack. */
  isBackDisabled?: boolean;
  children?: ReactNode;
};

/** Back sits left, matching WizardHeader, and in normal flow rather than overlaying. */
export function ReportHeader({
  title,
  subtitle,
  onBack,
  isBackDisabled = false,
  children,
}: ReportHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing[32] }]}>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text variant="h3" color="textInverse">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="label14" color="primaryTint">
              {subtitle}
            </Text>
          ) : null}
        </View>

        {onBack || isBackDisabled ? (
          <TouchableOpacity
            onPress={onBack}
            disabled={isBackDisabled}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            accessibilityState={{ disabled: isBackDisabled }}
          >
            <BackIcon size={24} color={colors.textInverse} />
          </TouchableOpacity>
        ) : null}
      </View>

      {children}
    </View>
  );
}

const hitSlop = { top: 24, bottom: 24, left: 24, right: 24 };

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[32],
    gap: spacing[24],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  text: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing[4],
  },
});
