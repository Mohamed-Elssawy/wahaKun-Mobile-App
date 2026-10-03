import { ReportSummaryCard } from '@/components/ui';
import type { ColorToken } from '@/theme';

import { formatReportReference } from '../format';
import { isClosedWireStatus } from '../lifecycle';
import { formatRelativeTime } from '../relativeTime';
import { describeSeverity } from '../severity';

import type { Report } from '../types';

export type ReportRowProps = {
  report: Report;
  onPress: (reportId: string) => void;
};

const UNTITLED = 'بلاغ بدون وصف';

/** Green once it is fixed, whatever the severity was; grey while there is no analysis. */
function stripeColor(report: Report): ColorToken {
  if (isClosedWireStatus(report.status)) {
    return 'success';
  }
  return report.analysis
    ? describeSeverity(report.analysis.severity).color
    : 'borderStrong';
}

/** One report in the My Issues list, mapped onto the card F-05 and F-06 draw too. */
export function ReportRow({ report, onPress }: ReportRowProps) {
  const title = report.analysis?.problemArabic || report.description || UNTITLED;
  const photo = report.attachments.find(attachment => attachment.type === 'Photo');

  return (
    <ReportSummaryCard
      title={title}
      reference={formatReportReference(report.id)}
      timeLabel={formatRelativeTime(report.createdAt)}
      borderColor={stripeColor(report)}
      photoUrl={photo?.url}
      onPress={() => onPress(report.id)}
    />
  );
}
