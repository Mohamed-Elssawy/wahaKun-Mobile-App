import { ReportSummaryCard } from '@/components/ui';
import { formatReportReference } from '@/features/reports/format';
import { formatRelativeTime } from '@/features/reports/relativeTime';

import { describeTierDisplay } from '../tier';

import type { MapIssue } from '../types';

export type MapPeekCardProps = {
  issue: MapIssue;
  /** Set only in X-11's stack, where the card is the way into the issue. */
  onPress?: (issueId: string) => void;
};

/** The card inside F-05's peek sheet. Its top edge carries the tier, nothing else does. */
export function MapPeekCard({ issue, onPress }: MapPeekCardProps) {
  const { color } = describeTierDisplay(issue.tier);

  return (
    <ReportSummaryCard
      title={issue.title}
      reference={formatReportReference(issue.id)}
      timeLabel={formatRelativeTime(issue.createdAt)}
      borderColor={color}
      photoUrl={issue.photoUrl}
      onPress={onPress ? () => onPress(issue.id) : undefined}
    />
  );
}
