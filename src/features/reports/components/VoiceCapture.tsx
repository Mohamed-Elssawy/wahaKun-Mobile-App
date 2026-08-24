import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { screenPadding, spacing } from '@/theme';

import { CaptureDivider } from './CaptureDivider';
import { VoiceCaptureCard } from './VoiceCaptureCard';
import { VoiceRecordButton } from './VoiceRecordButton';

export type VoiceCaptureProps = {
  description: string;
  onDescriptionChange: (description: string) => void;
  /** Sending needs a photo, so the only way on from here is the صورة tab. */
  onNeedsPhoto: () => void;
  onRequestMicrophone: () => Promise<boolean>;
  onMicrophoneDenied: () => void;
};

const WRITE_TITLE = 'صف المشكلة بالكتابة';
const PLACEHOLDER = 'مثال: القناة مكسورة و الماء يتسرب إلى الحقل';
const SUBMIT = 'ارسال المشكلة';
const PHOTO_REQUIRED = 'البلاغ يحتاج صورة للمشكلة — أضفها من تبويب صورة.';

const DESCRIPTION_LINES = 4;

// Recording is not wired up: no audio field on CreateReportRequest, no library installed.
export function VoiceCapture({
  description,
  onDescriptionChange,
  onNeedsPhoto,
  onRequestMicrophone,
  onMicrophoneDenied,
}: VoiceCaptureProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <VoiceCaptureCard />
      <VoiceRecordButton
        onRequestPermission={onRequestMicrophone}
        onPermissionDenied={onMicrophoneDenied}
      />

      <CaptureDivider />

      <View style={styles.write}>
        <Text variant="h4" color="textStrong" align="right">
          {WRITE_TITLE}
        </Text>

        <TextField
          value={description}
          onChangeText={onDescriptionChange}
          placeholder={PLACEHOLDER}
          multiline
          numberOfLines={DESCRIPTION_LINES}
          textAlignVertical="top"
          inputStyle={styles.descriptionInput}
        />
      </View>

      <Button label={SUBMIT} onPress={onNeedsPhoto} showArrow />

      <Text variant="label12" color="textSecondary" align="center">
        {PHOTO_REQUIRED}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[24],
    alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingTop: spacing[24],
    paddingBottom: spacing[32],
  },
  write: {
    alignSelf: 'stretch',
    gap: spacing[12],
  },
  descriptionInput: {
    // Arabic prose, unlike the email and phone fields this primitive was built for.
    textAlign: 'right',
    // minHeight, not height: a fixed box clips both the text and the OS font scale.
    minHeight: 96,
  },
});
