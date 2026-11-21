import { Send } from 'lucide-react-native';
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
import { formatReportReference } from '@/features/reports/format';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { describeSeverity } from '@/features/reports/severity';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { ExpertStepper } from '../../components/ExpertStepper';
import { RepairPhotoUpload } from '../../components/RepairPhotoUpload';
import { useConfirmRepair } from '../../hooks/useConfirmRepair';

/** Matches C45's secondary glyphs, which are the only other icons inside a Button. */
const CTA_ICON = 20;

/** E-04, node 5. Exactly one photo is structural: useImagePicker can never hold more. */
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
        <ReportHeader title={t('e04.title')} onBack={navigation.goBack} />
        <View style={styles.body}>
          <ReportErrorView
            error={
              confirmRepair.error ?? {
                kind: 'unknown',
                message: t('errors.case.loadFailed'),
              }
            }
            unknownTitle={t('errors.case.loadFailed')}
            onRetry={confirmRepair.retry}
          />
        </View>
      </View>
    );
  }

  const { detail } = confirmRepair;
  const severity = describeSeverity(detail.severity);

  const handleSubmit = async () => {
    // Read before submit: the payload is what was sent, not what the fields hold afterwards.
    const submitted = {
      notes: confirmRepair.notes.trim(),
      ...(confirmRepair.photo ? { photoUri: confirmRepair.photo.uri } : {}),
    };

    const didSubmit = await confirmRepair.submit();
    if (didSubmit) {
      // Carried forward because no endpoint reads it back - see the route's own comment.
      navigation.replace('ExpertAwaitingApproval', { reportId, submitted });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ReportHeader title={t('e04.title')} onBack={navigation.goBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* C71/SPEC 376: trailing chevron opens E-07's full report, an edge SPEC 232's chain omits, added per Islam's ruling in E10. */}
        <ReportSummaryCard
          title={detail.title}
          reference={formatReportReference(detail.reportId)}
          timeLabel={formatRelativeTime(detail.createdAt)}
          borderColor={severity.color}
          photoUrl={detail.photoUrl}
          onPress={() => navigation.navigate('ExpertIssueDetails', { reportId })}
        />

        <ExpertStepper current={3} />

        <RepairPhotoUpload
          photo={confirmRepair.photo}
          error={confirmRepair.photoError}
          onPickFromCamera={confirmRepair.pickFromCamera}
          onPickFromGallery={confirmRepair.pickFromGallery}
        />

        <TextField
          label={t('expert.resolutionNotes')}
          placeholder={t('expert.resolutionPlaceholder')}
          value={confirmRepair.notes}
          onChangeText={confirmRepair.setNotes}
          multiline
          numberOfLines={4}
          inputStyle={styles.notesInput}
        />

        {confirmRepair.submitError ? (
          <ReportErrorView
            error={confirmRepair.submitError}
            unknownTitle={t('e04.confirmErrorTitle')}
            onRetry={handleSubmit}
          />
        ) : null}

        {/* C74: paper-plane icon trails, matching E-02's arrow and the original Arabic frames for E-03/E-04. */}
        <Button
          label={t('e04.primaryCta')}
          icon={<Send size={CTA_ICON} color={colors.textInverse} />}
          iconTrails
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
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
