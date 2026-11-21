// GET /Farmer/{issueId}/tracking. Enums are names (R2); integer forms stay in case of a revert.

/** One `StatusHistory` row. Nothing but `status` and `changedAt` is read by the mapper. */
export function trackingStep(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    status: 'Assigned',
    name: 'Expert Assigned',
    state: 'Current',
    changedAt: '2026-10-13T20:33:06.9534246',
    note: 'Issue Assigned by system',
    expertId: '2835c061-3f41-4d22-ef63-08df26746bb4',
    // N1: a phone number, not a display name. UserName is the phone number in this system.
    expertName: '+201010000008',
    expertPhoto: '',
    repairPhoto: null,
    ...overrides,
  };
}

// E4 verbatim: no Reported row, a Diagnosed row 66 ms before Assigned (N2), and rows newest first.
export const e4Tracking: Record<string, unknown> = {
  issueId: 'e1c8270f-09a7-4e2a-4291-08df27ce0175',
  currentStatus: 'Assigned',
  steps: [
    trackingStep(),
    trackingStep({
      status: 'Diagnosed',
      name: 'AI Diagnosis',
      state: 'Completed',
      changedAt: '2026-10-13T20:33:06.8873137',
      note: 'Issue Diagnosed by system',
      expertId: null,
      expertName: null,
      expertPhoto: null,
    }),
  ],
};

// Two Assigned rows newest first, so .find returns the latest and steps[] is never reversed.
export const reassignedTwice: Record<string, unknown> = {
  issueId: 'reassigned-1',
  currentStatus: 'Assigned',
  steps: [
    trackingStep({
      changedAt: '2026-10-13T20:00:00',
      expertName: '+201010000099',
      note: 'Issue Assigned by admin',
    }),
    trackingStep({
      changedAt: '2026-10-11T08:00:00',
      expertName: '+201010000008',
    }),
    trackingStep({
      status: 'Diagnosed',
      name: 'AI Diagnosis',
      state: 'Completed',
      changedAt: '2026-10-11T07:00:00',
    }),
  ],
};

/** The same duplication on `Scheduled`, which node 4's done datetime reads. */
export const rescheduledTwice: Record<string, unknown> = {
  issueId: 'rescheduled-1',
  currentStatus: 'Scheduled',
  steps: [
    trackingStep({
      status: 'Scheduled',
      name: 'Repair Scheduled',
      changedAt: '2026-10-14T09:00:00',
    }),
    trackingStep({
      status: 'Scheduled',
      name: 'Repair Scheduled',
      changedAt: '2026-10-12T09:00:00',
    }),
    trackingStep({
      status: 'Reviewed',
      name: 'Expert Review',
      state: 'Completed',
      changedAt: '2026-10-11T09:00:00',
    }),
  ],
};

// D6: a repair with no photo. The status is what proves it happened, not repairPhoto.
export const repairedWithoutPhoto: Record<string, unknown> = {
  issueId: 'repaired-no-photo',
  currentStatus: 'Repaired',
  steps: [
    trackingStep({
      status: 'Repaired',
      name: 'Repair Published',
      changedAt: '2026-10-14T12:00:00',
      repairPhoto: null,
    }),
    trackingStep({
      status: 'Scheduled',
      name: 'Repair Scheduled',
      state: 'Completed',
      changedAt: '2026-10-13T09:00:00',
    }),
  ],
};

/** D5. A repair whose history row carried no `changedAt`, which must not become "now". */
export const repairedWithoutTimestamp: Record<string, unknown> = {
  issueId: 'repaired-no-time',
  currentStatus: 'Repaired',
  steps: [
    trackingStep({
      status: 'Repaired',
      name: 'Repair Published',
      changedAt: null,
      repairPhoto: 'issues/repair-proof.jpg',
    }),
  ],
};

/** A repair with both halves, so the fix cannot be mistaken for "never render the payload". */
export const repairedWithPhoto: Record<string, unknown> = {
  issueId: 'repaired-full',
  currentStatus: 'Repaired',
  steps: [
    trackingStep({
      status: 'Repaired',
      name: 'Repair Published',
      changedAt: '2026-10-14T12:00:00',
      repairPhoto: 'issues/repair-proof.jpg',
    }),
  ],
};

/** One tracking body per status, in whichever vocabulary the caller asks for. */
export function trackingAt(
  currentStatus: string | number,
  stepStatus: string | number = currentStatus,
): Record<string, unknown> {
  return {
    issueId: `at-${currentStatus}`,
    currentStatus,
    steps: [trackingStep({ status: stepStatus, changedAt: '2026-10-14T12:00:00' })],
  };
}
