import { fromWireStatus, isClosedStatus } from './lifecycle';

import type { LifecycleFacts } from './lifecycle';
import type { ReportTrackerDetails } from './types';

/** The tracker carries hasExpertReview directly, unlike a bare wire status. */
export function trackerFacts(details: ReportTrackerDetails): LifecycleFacts {
  // G2: the server can never send Reopened, so ReportStatus does not claim it.
  const status = details.reopened ? 'Reopened' : fromWireStatus(details.status);
  // A closed case implies both, even for a payload that stopped sending the fields.
  const isClosed = isClosedStatus(status);

  return {
    status,
    hasAiAnalysis: details.status !== 'Reported',
    hasExpertReview: details.hasExpertReview ?? false,
    hasAppointment: details.appointment != null || isClosed,
    hasRepairConfirmation: details.repair != null || isClosed,
  };
}
