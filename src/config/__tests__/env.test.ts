import {
  DEMO_MODE,
  ENABLE_COMMENT_POSTING,
  ESCALATE_LOW_CONFIDENCE,
  MOCK_ROLE,
  MOCK_SCENARIO,
  USE_MOCK_COMMUNITY,
  USE_MOCK_EXPERT_CHATS,
  USE_MOCK_EXPERT_QUEUE,
  USE_MOCK_MAP,
  USE_MOCK_NOTIFICATIONS,
  USE_MOCK_REPORTS,
  USE_MOCK_ROLE,
  USE_MOCK_TRACKER,
  USE_MOCK_USER,
} from '../env';
import {
  FORCE_LANGUAGE_FAILURE_OVERRIDE,
  FORCE_LOCALE_OVERRIDE,
} from '../env.local.example';

// main is the public build, so the committed defaults are the product.
describe('committed feature flag defaults', () => {
  it('never ships with demo or mock defaults on', () => {
    expect(DEMO_MODE).toBe(false);
    expect(MOCK_SCENARIO).toBe('content');
  });

  // L-DEFAULT: asserted against the committed surface, not the resolved value, so a machine set to English still passes.
  it('falls back to Arabic when the machine sets no override', () => {
    jest.isolateModules(() => {
      jest.doMock('../env.local', () => ({
        HOST_OVERRIDE: null,
        API_MODE_OVERRIDE: null,
        API_GATEWAY_URL_OVERRIDE: null,
        FORCE_LOCALE_OVERRIDE: null,
        FORCE_LANGUAGE_FAILURE_OVERRIDE: null,
      }));

      expect(require('../env').FORCE_LOCALE).toBeNull();
    });
  });

  // What postinstall copies onto a machine that has no env.local.ts yet.
  it('ships the example override unset, so a fresh install opens in Arabic', () => {
    expect(FORCE_LOCALE_OVERRIDE).toBeNull();
  });

  // E7's three forced failure states are a dev affordance; a committed value would wedge S-12 into a failure branch.
  it('ships with no forced language failure, in both halves', () => {
    expect(FORCE_LANGUAGE_FAILURE_OVERRIDE).toBeNull();

    jest.isolateModules(() => {
      jest.doMock('../env.local', () => ({
        HOST_OVERRIDE: null,
        API_MODE_OVERRIDE: null,
        API_GATEWAY_URL_OVERRIDE: null,
        FORCE_LOCALE_OVERRIDE: null,
        FORCE_LANGUAGE_FAILURE_OVERRIDE: null,
      }));

      expect(require('../env').FORCE_LANGUAGE_FAILURE).toBeNull();
    });
  });

  // Each of these is `DEMO_MODE || …`, so the assertion above is what actually holds them down.
  it('leaves every flag that only demo mode turns on in its off state', () => {
    expect(USE_MOCK_REPORTS).toBe(false);
    expect(USE_MOCK_USER).toBe(false);
    expect(ENABLE_COMMENT_POSTING).toBe(false);
    // Added in E5. Before it, DEMO_MODE reached every feature but this one.
    expect(USE_MOCK_MAP).toBe(false);
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
