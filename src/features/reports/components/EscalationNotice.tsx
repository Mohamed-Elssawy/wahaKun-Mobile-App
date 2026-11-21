import { CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { spacing } from '@/theme';

import { DiagnosisNote } from './DiagnosisNote';
import { escalationLine } from '../lifecycle';

/** One component for both frames. t('f04.escalationTitle') is third-person, since an expert reads it on E-07 too. */
export function EscalationNotice() {
  return (
    <View style={styles.group}>
      <Text variant="h4">{t('f04.escalationTitle')}</Text>

      <DiagnosisNote icon={CheckCircle2} label={t('f04.escalationWhy')}>
        {escalationLine()}
      </DiagnosisNote>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing[12],
  },
});
