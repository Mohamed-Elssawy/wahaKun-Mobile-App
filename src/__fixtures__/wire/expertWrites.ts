// The three ExpertController writes' success bodies, BACKEND-INTEGRATION-FACTS.md §4.2.
// Every one is discarded today: all three service functions are Promise<void> over
// apiClient.post<unknown>. The fixtures exist to pin what is being thrown away.

/** SubmitExpertReviewResponse. `status` and `decision` come back as STRINGS, not the sent ints. */
export const submitReviewResponse: unknown = {
  reviewId: '1d4f1c6a-8b2e-4f7a-9c3d-2e5b8a0f7c41',
  issueId: 'issue-1',
  status: 'Reviewed',
  notes: '[تصحيح] تصدع إنشائي | عالية\nيحتاج دعامة',
  decision: 'Override',
};

/** RepairScheduleResponse. `id` is the only handle on the row, and nothing keeps it. */
export const scheduleResponse: unknown = {
  id: '9a7c2f31-6d0b-4e58-8a1f-3c9e4b7d2a60',
  issueId: 'issue-1',
  scheduledDate: '2026-10-09',
  slotStart: '09:00:00',
  slotEnd: '11:00:00',
  farmerNotified: true,
  notes: 'سأصل في الموعد',
  status: 'Scheduled',
};

/** The resolution response. `filePath` is the repair proof's object key in MediaStorage. */
export const resolutionResponse: unknown = {
  id: '4b8e1a07-2c5f-4d93-b6a1-7e0c3f9d5b82',
  actionRepair: 'تم استبدال الوصلة',
  status: 'Repaired',
  filePath: 'reportimage/repair-proof.jpg',
};
