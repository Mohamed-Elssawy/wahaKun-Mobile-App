import {
  DEMO_MODE,
  ENABLE_COMMENT_POSTING,
  ESCALATE_LOW_CONFIDENCE,
  MOCK_SCENARIO,
  USE_MOCK_COMMUNITY,
  USE_MOCK_REPORTS,
  USE_MOCK_USER,
} from '../env';

// main is the public build against the real backend, so the committed defaults are the product.
// Nothing else stands between a stray `git commit -a` and the public app running on mocks.
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

  // On by backend gap, not by choice: CommunityService has no feed endpoint yet. Asserted so
  // that flipping it off reads as the deliberate wiring step it is.
  it('still serves the feed from the mock, because the endpoint does not exist', () => {
    expect(USE_MOCK_COMMUNITY).toBe(true);
  });

  // A product stance, not a gap: SYSTEM-SPEC T2 keeps uncertainty language away from farmers.
  // Turning this off would put a sub-80% diagnosis back in front of them on three surfaces.
  it('escalates a low-confidence diagnosis rather than showing it to the farmer', () => {
    expect(ESCALATE_LOW_CONFIDENCE).toBe(true);
  });
});
