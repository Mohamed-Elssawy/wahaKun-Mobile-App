import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing } from '@/theme';

export type IssueTranscriptProps = {
  transcript: string;
};

const TITLE = 'النص من التسجيل';

/** PROPOSED: no endpoint returns a transcript, so only the mock can fill this. */
export function IssueTranscript({ transcript }: IssueTranscriptProps) {
  return (
    <View style={styles.section}>
      <Text variant="h4" align="right" color="textStrong">
        {TITLE}
      </Text>

      {/* Quoted, as the frame draws it: these are the farmer's words, not the app's. */}
      <Text variant="body16" align="right" color="textStrong">
        {`”${transcript}“`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[8],
  },
});
