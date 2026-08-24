import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { screenPadding, spacing } from '@/theme';

export type CaptureNoticeProps = {
  title: string;
  message?: string;
};

/** Plain copy, not an error colour: nothing failed, the camera just cannot run. */
export function CaptureNotice({ title, message }: CaptureNoticeProps) {
  return (
    <View style={styles.notice}>
      <Text variant="h4" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="label14" color="textMuted" align="center">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    paddingHorizontal: screenPadding,
  },
});
