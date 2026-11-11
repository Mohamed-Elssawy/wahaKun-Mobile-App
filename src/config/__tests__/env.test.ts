import {
  DEMO_MODE,
  ENABLE_COMMENT_POSTING,
  ESCALATE_LOW_CONFIDENCE,
  MOCK_ROLE,
  MOCK_SCENARIO,
  USE_MOCK_COMMUNITY,
  USE_MOCK_EXPERT_CHATS,
  USE_MOCK_EXPERT_QUEUE,
  USE_MOCK_NOTIFICATIONS,
  USE_MOCK_REPORTS,
  USE_MOCK_ROLE,
  USE_MOCK_TRACKER,
  USE_MOCK_USER,
} from '../env';

// main is the public build, so the committed defaults are the product.
describe('committed feature flag defaults', () => {
  it('never ships with demo or mock defaults on', () => {
    expect(DEMO_MODE).toBe(false);
    expect(MOCK_SCENARIO).toBe('content');
  });

  // Each of these is `DEMO_MODE || …`, so the assertion above is what actually holds them down.
  it('leaves every flag that only demo mode turns on in its off state', () => {
    expect(USE_MOCK_REPORTS).toBe(false);
    expect(USE_MOCK_USER).toBe(false);
    expect(ENABLE_COMMENT_POSTING).toBe(false);
  });

  // On by backend gap: CommunityService has no feed endpoint yet.
  it('still serves the feed from the mock, because the endpoint does not exist', () => {
    expect(USE_MOCK_COMMUNITY).toBe(true);
  });

  // Off since the role was wired to the JWT; MOCK_ROLE stays farmer so no demo boots as expert.
  it('reads the account role from the token, and still demos as a farmer', () => {
    expect(USE_MOCK_ROLE).toBe(false);
    expect(MOCK_ROLE).toBe('farmer');
  });

  // Unpinned by P13: a || true creeping back would put F-06 on seeded data against a live server.
  it('serves the tracker from the real /Farmer/{id}/tracking route', () => {
    expect(DEMO_MODE).toBe(false);
    expect(USE_MOCK_TRACKER).toBe(false);
  });

  // Off since the expert service was wired. Chat keeps its own flag: ChatService has no controller.
  it('serves the expert queue from the real endpoint, and chat from the mock', () => {
    expect(USE_MOCK_EXPERT_QUEUE).toBe(false);
    expect(USE_MOCK_EXPERT_CHATS).toBe(true);
  });

  // On by backend gap: NotificationService has no route the app has ever found.
  it('keeps notifications on the mock until NotificationService gets a route', () => {
    expect(DEMO_MODE).toBe(false);
    expect(USE_MOCK_NOTIFICATIONS).toBe(true);
  });

  // A product stance, not a gap: T2 keeps uncertainty language away from farmers.
  it('escalates a low-confidence diagnosis rather than showing it to the farmer', () => {
    expect(ESCALATE_LOW_CONFIDENCE).toBe(true);
  });
});
