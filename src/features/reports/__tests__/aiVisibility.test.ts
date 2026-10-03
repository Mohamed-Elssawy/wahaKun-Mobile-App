import { farmerSeesAi } from '../aiVisibility';

/**
 * The model's own boundary tests cover both sides of the flag. These assert what the committed
 * flag actually does, so flipping ESCALATE_LOW_CONFIDENCE fails here rather than on a device.
 */
describe('farmerSeesAi with the committed flag', () => {
  it('hides a sub-threshold diagnosis', () => {
    expect(farmerSeesAi({ confidence: 0.79 })).toBe(false);
    expect(farmerSeesAi({ confidence: 0.62 })).toBe(false);
  });

  it('shows a diagnosis at or above the threshold', () => {
    expect(farmerSeesAi({ confidence: 0.8 })).toBe(true);
    expect(farmerSeesAi({ confidence: 0.91 })).toBe(true);
  });

  it('hides everything when the transcript never arrived, however sure the model was', () => {
    expect(farmerSeesAi({ confidence: 0.99, transcriptionFailed: true })).toBe(false);
  });

  // §10.2: a severity the expert repainted is the expert's, not the model's.
  it('shows a reviewed case whatever the model scored', () => {
    expect(farmerSeesAi({ confidence: 0.4, hasExpertReview: true })).toBe(true);
  });
});
