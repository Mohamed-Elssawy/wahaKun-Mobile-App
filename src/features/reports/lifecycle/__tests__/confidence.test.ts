import { showsAiBlock } from '../selectors';
import { CONFIDENCE_THRESHOLD } from '../statuses';

import type { AiVisibilityInput } from '../selectors';

function visibility(overrides: Partial<AiVisibilityInput> = {}): AiVisibilityInput {
  return {
    audience: 'farmer',
    confidence: 0.91,
    hasExpertReview: false,
    escalateLowConfidence: true,
    ...overrides,
  };
}

describe('the 80% threshold', () => {
  it('is 0.8, and §8.3 makes it a constant rather than a setting', () => {
    expect(CONFIDENCE_THRESHOLD).toBe(0.8);
  });

  it('hides the block from the farmer at 79%', () => {
    expect(showsAiBlock(visibility({ confidence: 0.79 }))).toBe(false);
  });

  // The boundary is inclusive: §8.3's low-confidence filter cuts at exactly 80%.
  it('shows the block from the farmer at exactly 80%', () => {
    expect(showsAiBlock(visibility({ confidence: 0.8 }))).toBe(true);
  });

  it('shows the block from the farmer at 81%', () => {
    expect(showsAiBlock(visibility({ confidence: 0.81 }))).toBe(true);
  });
});

describe('§10.2 asymmetry', () => {
  it.each([0.79, 0.8, 0.81, 0])('shows the expert the block at %p', confidence => {
    expect(showsAiBlock(visibility({ audience: 'expert', confidence }))).toBe(true);
  });

  it('shows the farmer everything when escalation is off', () => {
    expect(
      showsAiBlock(visibility({ confidence: 0.4, escalateLowConfidence: false })),
    ).toBe(true);
  });

  // §10.2: a severity the expert repainted is visible to the farmer, whatever the model scored.
  it('lifts the gate once the expert has reviewed', () => {
    expect(showsAiBlock(visibility({ confidence: 0.62, hasExpertReview: true }))).toBe(
      true,
    );
  });
});

describe('T2 transcription failure', () => {
  it('hides the block from the farmer however confident the model was', () => {
    expect(
      showsAiBlock(visibility({ confidence: 0.99, transcriptionFailed: true })),
    ).toBe(false);
  });

  it('still shows it to the expert', () => {
    expect(
      showsAiBlock(
        visibility({ audience: 'expert', confidence: 0.3, transcriptionFailed: true }),
      ),
    ).toBe(true);
  });
});
