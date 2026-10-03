import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button, ProgressRing, ReportSummaryCard, TextField } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { describeSeverity } from '@/features/reports/severity';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { ExpertStepper } from '../../components/ExpertStepper';
import { RepairPhotoUpload } from '../../components/RepairPhotoUpload';
import { useConfirmRepair } from '../../hooks/useConfirmRepair';

const TITLE = 'تأكيد حل المشكلة';
const NOTES_LABEL = 'ملاحظات الحل';
const NOTES_PLACEHOLDER = 'صف الإجراء الذي تم تنفيذه...';
const PRIMARY_LABEL = '✈ تأكيد الحل و إشعار المزارع';
const LOAD_ERROR_TITLE = 'تعذر تحميل الحالة';

/** §8.3's E-04, node 5. Both the photo and the notes are mandatory; exactly one photo is
 * structural - `useImagePicker` can never hold more than one. */
export default function ExpertResolutionConfirmationScreen({
  route,
  navigation,
}: ScreenProps<'ExpertResolutionConfirmation'>) {
  const { reportId } = route.params;
  const confirmRepair = useConfirmRepair(reportId);

  if (confirmRepair.isLoading) {
    return (
      <View style={styles.centred}>
        <ProgressRing />
      </View>
    );
  }

  if (confirmRepair.error || !confirmRepair.detail) {
    return (
      <View style={styles.screen}>
        <ReportHeader title={TITLE} onBack={navigation.goBack} />
        <View style={styles.body}>
          <ReportErrorView
            error={confirmRepair.error ?? { kind: 'unknown', message: LOAD_ERROR_TITLE }}
            unknownTitle={LOAD_ERROR_TITLE}
            onRetry={confirmRepair.retry}
          />
        </View>
      </View>
    );
  }

  const { detail } = confirmRepair;
  const severity = describeSeverity(detail.severity);

  const handleSubmit = async () => {
    const didSubmit = await confirmRepair.submit();
    if (didSubmit) {
      navigation.replace('ExpertAwaitingApproval', { reportId });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ReportHeader title={TITLE} onBack={navigation.goBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ReportSummaryCard
          title={detail.title}
          reference={`#${detail.reportId}`}
          timeLabel={formatRelativeTime(detail.createdAt)}
          borderColor={severity.color}
          photoUrl={detail.photoUrl}
        />

        <ExpertStepper current={3} />

        <RepairPhotoUpload
          photo={confirmRepair.photo}
          error={confirmRepair.photoError}
          onPickFromCamera={confirmRepair.pickFromCamera}
          onPickFromGallery={confirmRepair.pickFromGallery}
        />

        <TextField
          label={NOTES_LABEL}
          placeholder={NOTES_PLACEHOLDER}
          value={confirmRepair.notes}
          onChangeText={confirmRepair.setNotes}
          multiline
          numberOfLines={4}
          inputStyle={styles.notesInput}
        />

        {confirmRepair.submitError ? (
          <ReportErrorView
            error={confirmRepair.submitError}
            unknownTitle="تعذر تأكيد الحل"
            onRetry={handleSubmit}
          />
        ) : null}

        <Button
          label={PRIMARY_LABEL}
          onPress={handleSubmit}
          disabled={!confirmRepair.canSubmit}
          loading={confirmRepair.isSubmitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing[24],
    paddingBottom: spacing[32],
    gap: spacing[24],
  },
  notesInput: {
    textAlign: 'right',
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
