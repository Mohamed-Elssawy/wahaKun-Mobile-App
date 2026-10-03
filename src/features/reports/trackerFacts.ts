import { fromWireStatus, isClosedStatus } from './lifecycle';

import type { LifecycleFacts } from './lifecycle';
import type { ReportTrackerDetails } from './types';

/**
 * F-06's only route into the S1 model. `ReportTrackerDetails` carries `hasExpertReview`
 * directly - unlike a bare wire status, the tracker is allowed to say it - so this is the one
 * place besides `factsFromWireStatus` that may construct `LifecycleFacts`.
 */
export function trackerFacts(details: ReportTrackerDetails): LifecycleFacts {
  const status = fromWireStatus(details.status);
  // A closed case implies both happened, even for a fixture (or a future real payload) that
  // left the field off once there was no more reason to keep sending it.
  const isClosed = isClosedStatus(status);

  return {
    status,
    hasAiAnalysis: details.status !== 'Reported',
    hasExpertReview: details.hasExpertReview ?? false,
    hasAppointment: details.appointment != null || isClosed,
    hasRepairConfirmation: details.repair != null || isClosed,
  };
}
