import { currentNode } from '../lifecycle';
import { trackerFacts } from '../trackerFacts';

import type { ReportTrackerDetails } from '../types';

// One case per §8.2 named state, so a regression here is a regression F-06 would actually show.
describe('trackerFacts', () => {
  it('reads node 3 current when an expert is assigned but has not reviewed yet', () => {
    const details: ReportTrackerDetails = {
      reportId: '1',
      status: 'Assigned',
      hasExpertReview: false,
    };
    expect(currentNode(trackerFacts(details))).toBe(3);
  });

  it('reads node 4 current once the review is submitted', () => {
    const details: ReportTrackerDetails = {
      reportId: '1',
      status: 'Assigned',
      hasExpertReview: true,
    };
    expect(currentNode(trackerFacts(details))).toBe(4);
  });

  it('reads node 5 current once the appointment is confirmed but no repair yet', () => {
    const details: ReportTrackerDetails = {
      reportId: '1',
      status: 'Scheduled',
      hasExpertReview: true,
      appointment: {
        confirmedAt: '2026-06-01T00:00:00Z',
        date: '2026-06-05',
        windowStart: '09:00 ص',
        windowEnd: '12:00 م',
      },
    };
    expect(currentNode(trackerFacts(details))).toBe(5);
  });

  it('reads node 6 current, open, once the repair is published', () => {
    const details: ReportTrackerDetails = {
      reportId: '1',
      status: 'Repaired',
      hasExpertReview: true,
      repair: {
        confirmedAt: '2026-06-01T00:00:00Z',
        notes: 'تم الإصلاح',
        photoUrl: 'https://example.com/photo.jpg',
      },
    };
    const facts = trackerFacts(details);
    expect(currentNode(facts)).toBe(6);
  });

  it('treats a closed case as having an appointment and a repair even without the fields', () => {
    // Defensive: a future real payload might stop sending nodes 4-5's detail once the case is
    // closed, and a closed status alone must still place the case at node 6.
    const details: ReportTrackerDetails = { reportId: '1', status: 'completed' };
    const facts = trackerFacts(details);
    expect(facts.hasAppointment).toBe(true);
    expect(facts.hasRepairConfirmation).toBe(true);
    expect(currentNode(facts)).toBe(6);
  });

  it('defaults hasExpertReview to false when the tracker omits it', () => {
    const details: ReportTrackerDetails = { reportId: '1', status: 'Assigned' };
    expect(trackerFacts(details).hasExpertReview).toBe(false);
  });
});
