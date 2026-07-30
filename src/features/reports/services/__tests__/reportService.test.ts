import { normalizeConfidence } from '../reportService';

// Pins what makes the fold safe: a value already in range must come back untouched.
describe('normalizeConfidence', () => {
  it('leaves a fractional confidence untouched', () => {
    expect(normalizeConfidence(0.91)).toBe(0.91);
    expect(normalizeConfidence(0.62)).toBe(0.62);
    expect(normalizeConfidence(1)).toBe(1);
  });

  it('folds a percentage into the same range', () => {
    expect(normalizeConfidence(91)).toBeCloseTo(0.91);
    expect(normalizeConfidence(62)).toBeCloseTo(0.62);
    expect(normalizeConfidence(100)).toBe(1);
  });

  it('clamps above 100 rather than reporting more than certainty', () => {
    expect(normalizeConfidence(140)).toBe(1);
  });

  it('treats missing or nonsensical values as no confidence', () => {
    expect(normalizeConfidence(0)).toBe(0);
    expect(normalizeConfidence(-5)).toBe(0);
    expect(normalizeConfidence(NaN)).toBe(0);
    expect(normalizeConfidence(Infinity)).toBe(0);
  });
});
