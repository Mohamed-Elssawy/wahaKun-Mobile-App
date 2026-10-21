import { groupFor } from '../../time';
import { getNotifications, markAllRead } from '../notificationService.mock';

/** The mock simulates 500ms of latency per call. */
const TIMEOUT = 20_000;

describe('markAllRead', () => {
  it(
    'clears every row, including yesterday and last week - not just اليوم',
    async () => {
      const before = await getNotifications(1, 50);

      // The fixture has to span more than one group, or this would pass trivially.
      const groupsBefore = new Set(before.items.map(item => groupFor(item.createdAt)));
      expect(groupsBefore.size).toBeGreaterThan(1);
      expect(before.items.some(item => !item.isRead)).toBe(true);

      await markAllRead();

      const after = await getNotifications(1, 50);
      expect(after.items.every(item => item.isRead)).toBe(true);

      // Checks a non-today row: a mark-all stopping at a boundary would still pass every.
      const nonToday = after.items.find(item => groupFor(item.createdAt) !== 'today');
      expect(nonToday).toBeDefined();
      expect(nonToday?.isRead).toBe(true);
    },
    TIMEOUT,
  );
});
