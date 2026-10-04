import type { ExpertCta } from '@/features/reports/lifecycle';

import type { NavigationProp } from '@react-navigation/native';

/**
 * §8.3's C-CTA destinations. Shared by E-01's primary button and E-08's assigned peek, so the
 * map and the inbox land on the same screen for the same case - never a second switch.
 * Typed against ReactNavigation.RootParamList, not RootStackParamList directly, so it accepts
 * exactly what useNavigation() returns from any depth - the same reason every screen that
 * calls it does too, rather than threading a stack-specific navigation prop down. Narrowed to
 * `navigate` alone: the full NavigationProp's `getState` return type is a known mismatch
 * between what useNavigation() infers and the NavigationProp type it is declared against.
 */
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
