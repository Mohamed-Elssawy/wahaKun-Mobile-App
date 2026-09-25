import { ChevronRight } from 'lucide-react-native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { colors, screenPadding, spacing } from '@/theme';

import palmTreeLogo from '@assets/images/palmTreeLogoBlack.png';

export const TOTAL_REGISTRATION_STEPS = 5;

export type WizardHeaderProps = {
  /** 1-based step index. */
  step: number;
  onBack?: () => void;
  totalSteps?: number;
};

/** Logo, step label, back control and progress bar for every wizard step. */
export function WizardHeader({
  step,
  onBack,
  totalSteps = TOTAL_REGISTRATION_STEPS,
}: WizardHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <Image source={palmTreeLogo} style={styles.logo} />
          <Text variant="label14Bold" color="textStrong">
            {`الخطوة ${step} من ${totalSteps}`}
          </Text>
        </View>

        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
          >
            <ChevronRight size={24} color={colors.textStrong} />
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
    paddingTop: spacing[56],
    paddingBottom: spacing[12],
  },
  brand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[12],
  },
  logo: {
    width: 24,
    height: 24,
  },
});
