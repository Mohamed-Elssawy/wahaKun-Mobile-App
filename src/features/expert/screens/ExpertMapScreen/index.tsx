import { useNavigation } from '@react-navigation/native';

import type { MapPeekAction } from '@/features/map/components/MapPeekSheet';
import { OasisMapBody } from '@/features/map/components/OasisMapBody';
import type { MapIssue } from '@/features/map/types';
import { EXPERT_ACTION_LABELS } from '@/features/reports/lifecycle';

import { useAssignedCaseCtas } from '../../hooks/useAssignedCaseCtas';
import { navigateToExpertCta } from '../../navigateToCta';

const DETAILS_LABEL = 'عرض تفاصيل المشكلة';

/**
 * §8.3's E-08. Reuses the entire map feature unchanged - MapLibre, Esri tiles, clustering,
 * search, the legend - the only thing that differs from F-05 is the peek, which branches on
 * assignment and speaks expertCtaFor's own vocabulary, same as E-01's cards.
 */
export default function ExpertMapScreen() {
  const navigation = useNavigation();
  const ctaByReportId = useAssignedCaseCtas();

  const buildPeekAction = (issue: MapIssue): MapPeekAction => {
    const cta = ctaByReportId.get(issue.id);

    if (!cta) {
      return {
        label: DETAILS_LABEL,
        onPress: () => navigation.navigate('ExpertIssueDetails', { reportId: issue.id }),
      };
    }

    return {
      label: EXPERT_ACTION_LABELS[cta.action],
      onPress: () => navigateToExpertCta(navigation, issue.id, cta),
    };
  };

  return <OasisMapBody buildPeekAction={buildPeekAction} />;
}
