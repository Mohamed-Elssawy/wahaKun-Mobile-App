import { ReportSummaryCard } from '@/components/ui';
import type { ColorToken } from '@/theme';

import { farmerSeesAi } from '../aiVisibility';
import { formatReportReference } from '../format';
import { isClosedWireStatus, UNTITLED_REPORT } from '../lifecycle';
import { formatRelativeTime } from '../relativeTime';
import { describeSeverity } from '../severity';

import type { Report } from '../types';

export type ReportRowProps = {
  report: Report;
  onPress: (reportId: string) => void;
};

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
export function ReportRow({ report, onPress }: ReportRowProps) {
  const seesAi = report.analysis
    ? farmerSeesAi({ confidence: report.analysis.confidence })
    : false;

  // The description is the farmer's own words, so it survives an escalation; the title is the
  // model's and does not. T13's copy is the fallback either way.
  const aiTitle = seesAi ? report.analysis?.problemArabic : undefined;
  const title = aiTitle || report.description || UNTITLED_REPORT;
  const photo = report.attachments.find(attachment => attachment.type === 'Photo');

  return (
    <ReportSummaryCard
      title={title}
      reference={formatReportReference(report.id)}
      timeLabel={formatRelativeTime(report.createdAt)}
      borderColor={stripeColor(report, seesAi)}
      photoUrl={photo?.url}
      onPress={() => onPress(report.id)}
    />
  );
}
