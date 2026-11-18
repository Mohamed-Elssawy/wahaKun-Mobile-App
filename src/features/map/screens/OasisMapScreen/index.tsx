import { useNavigation } from '@react-navigation/native';

import { useOwnedReportIds } from '@/features/reports/hooks/useOwnedReportIds';
import { t } from '@/i18n';

import { OasisMapBody } from '../../components/OasisMapBody';

import type { MapPeekAction } from '../../components/MapPeekSheet';
import type { MapIssue } from '../../types';

/** F-05's farmer route: the peek branches on ownership, F-06 against F-04. */
export default function OasisMapScreen() {
  const navigation = useNavigation();
  const ownedIds = useOwnedReportIds();

  const buildPeekAction = (issue: MapIssue): MapPeekAction =>
    ownedIds.has(issue.id)
      ? {
          label: t('common.trackReport'),
          onPress: () => navigation.navigate('ReportTracker', { reportId: issue.id }),
        }
      : {
          label: t('common.viewIssueDetails'),
          onPress: () => navigation.navigate('IssueDetails', { reportId: issue.id }),
        };

  return <OasisMapBody buildPeekAction={buildPeekAction} />;
}
