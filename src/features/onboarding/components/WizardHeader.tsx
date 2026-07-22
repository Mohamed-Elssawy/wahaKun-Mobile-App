import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { screenPadding, spacing } from '@/theme';

import palmTreeLogo from '@assets/images/palmTreeLogoBlack.png';

export const TOTAL_REGISTRATION_STEPS = 7;

/** Arabic ordinal for each wizard step, indexed from 1. */
const STEP_LABELS = [
  '',
  'الخطوة الأولى',
  'الخطوة الثانية',
  'الخطوة الثالثة',
  'الخطوة الرابعة',
  'الخطوة الخامسة',
  'الخطوة السادسة',
  'الخطوة السابعة',
] as const;

export type WizardHeaderProps = {
  /** 1-based step index. */
  step: number;
  onBack?: () => void;
  /** Step 1 leaves the flow rather than going back, so it reads "الخروج". */
  backLabel?: string;
  totalSteps?: number;
};

/** Logo, step label, back control and progress bar for every wizard step. */
export function WizardHeader({
  step,
  onBack,
  backLabel = 'العودة',
  totalSteps = TOTAL_REGISTRATION_STEPS,
}: WizardHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <Image source={palmTreeLogo} style={styles.logo} />
          <Text variant="label14Bold" color="textStrong">
            {STEP_LABELS[step] ?? ''}
          </Text>
        </View>

        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={hitSlop} accessibilityRole="button">
            <Text variant="label14" color="textDisabled">
              {backLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ProgressBar step={step} totalSteps={totalSteps} />
    </View>
  );
}

const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

const styles = StyleSheet.create({
  header: {
    width: '100%',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  brand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 24,
    height: 24,
  },
});
