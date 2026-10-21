import { useNavigation } from '@react-navigation/native';

import { useOwnedReportIds } from '@/features/reports/hooks/useOwnedReportIds';

import { OasisMapBody } from '../../components/OasisMapBody';

import type { MapPeekAction } from '../../components/MapPeekSheet';
import type { MapIssue } from '../../types';

const TRACK_LABEL = 'تتبع البلاغ';
const DETAILS_LABEL = 'عرض تفاصيل المشكلة';

/** F-05's farmer route: the peek branches on ownership, F-06 against F-04. */
export default function OasisMapScreen() {
  const navigation = useNavigation();
  const ownedIds = useOwnedReportIds();

  const buildPeekAction = (issue: MapIssue): MapPeekAction =>
    ownedIds.has(issue.id)
      ? {
          label: TRACK_LABEL,
          onPress: () => navigation.navigate('ReportTracker', { reportId: issue.id }),
        }
      : {
          label: DETAILS_LABEL,
          onPress: () => navigation.navigate('IssueDetails', { reportId: issue.id }),
        };

  return <OasisMapBody buildPeekAction={buildPeekAction} />;
}
