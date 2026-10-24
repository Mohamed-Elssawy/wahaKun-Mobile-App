import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { Button, Text, TextField, VoicePlayer } from '@/components/ui';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { screenPadding, spacing } from '@/theme';

import { CaptureDivider } from './CaptureDivider';
import { RecordingControls } from './RecordingControls';
import { VoiceCaptureCard } from './VoiceCaptureCard';
import { VoiceRecordButton } from './VoiceRecordButton';
import { VoiceRecordingCard } from './VoiceRecordingCard';
import { VoiceReviewCard } from './VoiceReviewCard';

// Recording is real: nitro-sound was already a dependency, just not wired to its recorder half.
export type VoiceCaptureProps = {
  description: string;
  onDescriptionChange: (description: string) => void;
  /** Sending needs a photo, so the only real way on from here is the صورة tab. */
  onNeedsPhoto: () => void;
  onRequestMicrophone: () => Promise<boolean>;
  onMicrophoneDenied: () => void;
  recorder: ReturnType<typeof useAudioRecorder>;
  /** Bumped by X-04's tertiary to focus the text field without leaving voice mode. */
  focusTrigger: number;
};

const WRITE_TITLE = 'صف المشكلة بالكتابة';
const PLACEHOLDER = 'مثال: القناة مكسورة و الماء يتسرب إلى الحقل';
const SEND = 'ارسال المشكلة';
// BACKEND-GAP 28: /Issue/analyze requires a photo, so audio or text alone can never submit.
const SEND_DISABLED_REASON =
  'البلاغ يحتاج صورة للمشكلة أيضًا، حتى مع التسجيل أو الكتابة.';
const ADD_PHOTO = 'أضف صورة للمتابعة';
const RE_RECORD = 'إعادة التسجيل';
const RECORD_FAILED = 'تعذر بدء التسجيل، حاول مرة أخرى';

const DESCRIPTION_LINES = 4;

export function VoiceCapture({
  description,
  onDescriptionChange,
  onNeedsPhoto,
  onRequestMicrophone,
  onMicrophoneDenied,
  recorder,
  focusTrigger,
}: VoiceCaptureProps) {
  const textFieldRef = useRef<TextInput>(null);
  const player = useAudioPlayer(recorder.recordedUri ?? undefined);

  useEffect(() => {
    if (focusTrigger > 0) {
      textFieldRef.current?.focus();
    }
  }, [focusTrigger]);

  // One native object is shared by the record and play halves, so playback stops before recording.
  const handleRecordPress = async () => {
    await player.stop();
    const isGranted = await onRequestMicrophone();
    if (!isGranted) {
      onMicrophoneDenied();
      return;
    }
    recorder.start();
  };

  const handleDiscard = async () => {
    await player.stop();
    recorder.discard();
  };

  if (recorder.state === 'recording') {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <VoiceRecordingCard
          elapsedSeconds={recorder.elapsedSeconds}
          level={recorder.level}
        />
        <RecordingControls
          elapsedSeconds={recorder.elapsedSeconds}
          onStop={recorder.stop}
          onCancel={recorder.cancel}
        />
      </ScrollView>
    );
  }

  if (recorder.state === 'reviewing') {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <VoiceReviewCard
          isPlaying={player.isPlaying}
          progress={player.progress}
          onTogglePlayback={player.toggle}
          onUseRecording={recorder.confirm}
          onDiscard={handleDiscard}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {recorder.state === 'attached' ? (
        <View style={styles.attached}>
          <VoicePlayer
            title="التسجيل الصوتي"
            isPlaying={player.isPlaying}
            progress={player.progress}
            onToggle={player.toggle}
          />
          <TouchableOpacity
            style={styles.reRecordLink}
            onPress={handleDiscard}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={RE_RECORD}
          >
            <Text variant="label14" color="primary">
              {RE_RECORD}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <VoiceCaptureCard />
          <VoiceRecordButton onPress={handleRecordPress} />
          {recorder.hasFailed ? (
            <Text variant="label12" color="errorText" align="center">
              {RECORD_FAILED}
            </Text>
          ) : null}
        </>
      )}

      <CaptureDivider />

      <View style={styles.write}>
        <Text variant="h4" color="textStrong" align="right">
          {WRITE_TITLE}
        </Text>

        <TextField
          ref={textFieldRef}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder={PLACEHOLDER}
          multiline
          numberOfLines={DESCRIPTION_LINES}
          textAlignVertical="top"
          inputStyle={styles.descriptionInput}
        />
      </View>

      {/* BACKEND-GAP, see SEND_DISABLED_REASON above: disabled with the reason stated, not an
          enabled button that would fail after the farmer has already recorded or typed. */}
      <Button label={SEND} onPress={() => {}} disabled />
      <Text variant="label12" color="textSecondary" align="center">
        {SEND_DISABLED_REASON}
      </Text>

      <Button label={ADD_PHOTO} onPress={onNeedsPhoto} variant="secondary" showArrow />
    </ScrollView>
  );
}

const hitSlop = { top: 16, bottom: 16, left: 16, right: 16 };

const styles = StyleSheet.create({
  content: {
    gap: spacing[24],
    alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingTop: spacing[24],
    paddingBottom: spacing[32],
  },
  attached: {
    width: '100%',
    gap: spacing[12],
  },
  reRecordLink: {
    alignSelf: 'flex-end',
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
