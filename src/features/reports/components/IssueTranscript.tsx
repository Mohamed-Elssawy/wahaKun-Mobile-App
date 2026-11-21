import { StyleSheet, View } from 'react-native';

import { BiText, Text } from '@/components/ui';
import { detectDirection, t, direction as uiDirection } from '@/i18n';
import type { Direction } from '@/i18n';
import { spacing } from '@/theme';

export type IssueTranscriptProps = {
  transcript: string;
};

// A fixed quote pair reads backwards in one direction, so pick it by the same first-strong rule BiText uses.
const QUOTES: Record<Direction, readonly [string, string]> = {
  rtl: ['”', '“'],
  ltr: ['“', '”'],
};

/** PROPOSED: no endpoint returns a transcript, so only the mock can fill this. */
export function IssueTranscript({ transcript }: IssueTranscriptProps) {
  const [open, close] = QUOTES[detectDirection(transcript) ?? uiDirection()];

  return (
    <View style={styles.section}>
      <Text variant="h4" color="textStrong">
        {t('f04.transcriptTitle')}
      </Text>

      {/* Quoted, as the frame draws it: these are the farmer's words, not the app's. */}
      <BiText contentRole="body" variant="body16" color="textStrong">
        {`${open}${transcript}${close}`}
      </BiText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[8],
  },
});
