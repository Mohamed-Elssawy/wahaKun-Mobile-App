import { StyleSheet, View } from 'react-native';

import { ContextChip, ProgressBar, ReportSummaryCard, Text } from '@/components/ui';
import { spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { farmerSeesAi } from '../aiVisibility';
import { formatReportReference } from '../format';
import { useResolutionAction } from '../hooks/useResolutionAction';
import { isClosedWireStatus, UNTITLED_REPORT } from '../lifecycle';
import { formatRelativeTime } from '../relativeTime';
import { describeSeverity } from '../severity';
import { trackerFacts } from '../trackerFacts';
import { activeCardStep, buildActiveCardSlot } from '../trackerView';
import { TrackerApprovalControl } from './TrackerApprovalControl';

import type { Report, ReportTrackerDetails } from '../types';

export type ReportRowProps = {
  report: Report;
  onPress: (reportId: string) => void;
  /** §8.2 F-07's contextual slot. Absent for a closed report, which draws none. */
  trackerDetails?: ReportTrackerDetails;
  /** Fires after a successful confirm/reject, so the list can refetch. */
  onResolutionChanged?: () => void;
};

const TOTAL_NODES = 6;

/** Green once the farmer closes it; grey while there is no severity this farmer may see. */
function stripeColor(report: Report, seesAi: boolean): ColorToken {
  if (isClosedWireStatus(report.status)) {
    return 'success';
  }
  return report.analysis && seesAi
    ? describeSeverity(report.analysis.severity).color
    : 'borderStrong';
}

/** One report in the My Issues list, mapped onto the card F-05 and F-06 draw too. */
export function ReportRow({
  report,
  onPress,
  trackerDetails,
  onResolutionChanged,
}: ReportRowProps) {
  const seesAi = report.analysis
    ? farmerSeesAi({ confidence: report.analysis.confidence })
    : false;

  // The description is the farmer's own words, so it survives an escalation; the title is the
  // model's and does not. T13's copy is the fallback either way.
  const aiTitle = seesAi ? report.analysis?.problemArabic : undefined;
  const title = aiTitle || report.description || UNTITLED_REPORT;
  const photo = report.attachments.find(attachment => attachment.type === 'Photo');

  // Falls back to a bare wire-status read when the tracker fetch failed or is still in
  // flight, same as `factsFromWireStatus`, so a tap never throws for want of tracker data.
  const getFacts = () =>
    trackerFacts(trackerDetails ?? { reportId: report.id, status: report.status });
  const action = useResolutionAction(report.id, getFacts);

  const handleConfirm = async () => {
    const refusal = await action.confirm();
    if (!refusal) {
      onResolutionChanged?.();
    }
  };
  const handleReject = async () => {
    const refusal = await action.reject();
    if (!refusal) {
      onResolutionChanged?.();
    }
  };

  const slot = trackerDetails ? buildActiveCardSlot(trackerDetails) : null;

  return (
    <ReportSummaryCard
      title={title}
      reference={formatReportReference(report.id)}
      timeLabel={formatRelativeTime(report.createdAt)}
      borderColor={stripeColor(report, seesAi)}
      photoUrl={photo?.url}
      onPress={() => onPress(report.id)}
    >
      {trackerDetails ? (
        <View style={styles.footer}>
          <Text variant="label12" color="textSecondary" align="right">
            {`الخطوة ${activeCardStep(trackerDetails)} من ${TOTAL_NODES}`}
          </Text>

          <ProgressBar
            step={activeCardStep(trackerDetails)}
            totalSteps={TOTAL_NODES}
            color="primary"
          />

          {slot?.kind === 'chip' ? (
            <ContextChip
              tint={slot.chip.tint}
              icon={slot.chip.icon}
              label={slot.chip.label}
            />
          ) : null}

          {slot?.kind === 'approval' ? (
            <TrackerApprovalControl
              onConfirm={handleConfirm}
              onReject={handleReject}
              disabled={action.isActing}
            />
          ) : null}
        </View>
      ) : null}
    </ReportSummaryCard>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[12],
  },
});
