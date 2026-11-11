import type { ExpertCta } from '@/features/reports/lifecycle';

import type { NavigationProp } from '@react-navigation/native';

/** Shared by E-01's primary and E-08's peek, so both land on the same screen for the same case. */
export function navigateToExpertCta(
  navigation: Pick<NavigationProp<ReactNavigation.RootParamList>, 'navigate'>,
  reportId: string,
  cta: ExpertCta,
): void {
  switch (cta.screen) {
    case 'E-02':
      navigation.navigate('ExpertCaseReview', { reportId, state: cta.state });
      return;
    case 'E-03':
      navigation.navigate('ExpertSchedule', { reportId });
      return;
    case 'E-04':
      navigation.navigate('ExpertResolutionConfirmation', { reportId });
      return;
    case 'E-05':
      navigation.navigate('ExpertAwaitingApproval', { reportId });
      return;
    case 'E-06':
      navigation.navigate('ExpertCaseClosed', { reportId });
  }
}
