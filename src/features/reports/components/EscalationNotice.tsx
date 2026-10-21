import { CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing } from '@/theme';

import { DiagnosisNote } from './DiagnosisNote';
import { ESCALATION_LINE } from '../lifecycle';

const TITLE = 'خبير سيراجع البلاغ شخصياً';
const REASON_LABEL = 'لماذا سيراجعها خبير؟';

/** One component for both frames. TITLE is third-person, since an expert reads it on E-07 too. */
export function EscalationNotice() {
  return (
    <View style={styles.group}>
      <Text variant="h4" align="right">
        {TITLE}
      </Text>

      <DiagnosisNote icon={CheckCircle2} label={REASON_LABEL}>
        {ESCALATION_LINE}
      </DiagnosisNote>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing[12],
  },
});
