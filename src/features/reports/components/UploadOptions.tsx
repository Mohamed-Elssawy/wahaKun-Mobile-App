import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { screenPadding, spacing } from '@/theme';

import { CaptureDivider } from './CaptureDivider';
import { UploadPhotoCard } from './UploadPhotoCard';
import { VoiceCaptureCard } from './VoiceCaptureCard';
import { VoiceRecordButton } from './VoiceRecordButton';

export type UploadOptionsProps = {
  onAttachPhoto: () => void;
  error?: string;
};

/** The body of the upload mode: attach a photo, or (once it lands) speak the problem. */
export function UploadOptions({ onAttachPhoto, error }: UploadOptionsProps) {
  return (
    <View style={styles.options}>
      <UploadPhotoCard onPress={onAttachPhoto} />
      <CaptureDivider />
      <View style={styles.voice}>
        <VoiceCaptureCard />
        <VoiceRecordButton />
      </View>

      {error ? (
        <Text variant="label14Bold" color="errorText" align="center">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing[32],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[32],
  },
  voice: {
    gap: spacing[32],
    alignItems: 'center',
  },
});
