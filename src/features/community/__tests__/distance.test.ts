import { distanceKm, formatDistance } from '../distance';

const SIWA = { latitude: 29.2041, longitude: 25.5195 };

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    expect(distanceKm(SIWA, SIWA)).toBe(0);
  });

  it('measures a short hop across the oasis', () => {
    // ~1.1km north: one hundredth of a degree of latitude.
    const north = { latitude: 29.2141, longitude: 25.5195 };

    expect(distanceKm(SIWA, north)).toBeCloseTo(1.11, 1);
  });

  it('is symmetric', () => {
    const other = { latitude: 29.3, longitude: 25.6 };

    expect(distanceKm(SIWA, other)).toBeCloseTo(distanceKm(other, SIWA), 6);
  });
});

// F-01 writes "0.8 كم" and "3.2 كم", so the precision has to hold at those magnitudes.
describe('formatDistance', () => {
  it('keeps one decimal under ten kilometres', () => {
    expect(formatDistance(0.8)).toBe('0.8 كم');
    expect(formatDistance(3.24)).toBe('3.2 كم');
  });

  it('rounds to whole kilometres beyond ten', () => {
    expect(formatDistance(12.4)).toBe('12 كم');
  });

  // "0.0 كم" would claim a precision a phone GPS fix does not have.
  it('does not pretend to metre accuracy up close', () => {
    expect(formatDistance(0.02)).toBe('قريب جدًا');
  });

  it('says nothing rather than something wrong for a bad value', () => {
    expect(formatDistance(NaN)).toBe('');
    expect(formatDistance(-1)).toBe('');
  });
});
