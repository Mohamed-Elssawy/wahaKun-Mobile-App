import { decodeBase64, encodeBase64 } from '../base64';

const bytes = (...values: number[]) => new Uint8Array(values).buffer;
const toArray = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)];

describe('encodeBase64', () => {
  it('matches known values', () => {
    // "Man" -> TWFu is the canonical no-padding case from RFC 4648.
    expect(encodeBase64(bytes(77, 97, 110))).toBe('TWFu');
    expect(encodeBase64(bytes(77, 97))).toBe('TWE=');
    expect(encodeBase64(bytes(77))).toBe('TQ==');
  });

  it('handles an empty buffer', () => {
    expect(encodeBase64(bytes())).toBe('');
  });

  it('covers the top of the alphabet', () => {
    // 0xFF bytes exercise the '/' and '+' end, which a text-only test would miss.
    expect(encodeBase64(bytes(255, 255, 255))).toBe('////');
    expect(encodeBase64(bytes(251, 255, 190))).toBe('+/++');
  });
});

describe('round trip', () => {
  it.each([
    [[]],
    [[0]],
    [[0, 0]],
    [[1, 2, 3]],
    [[255, 0, 128, 64]],
    [[10, 20, 30, 40, 50]],
  ])('preserves %p', values => {
    expect(toArray(decodeBase64(encodeBase64(bytes(...values))))).toEqual(values);
  });

  it('preserves a buffer larger than one JPEG chunk', () => {
    const values = Array.from({ length: 5000 }, (_, i) => i % 256);
    const restored = toArray(decodeBase64(encodeBase64(bytes(...values))));
    expect(restored).toEqual(values);
  });
});

describe('decodeBase64', () => {
  it('ignores padding and whitespace', () => {
    expect(toArray(decodeBase64('TWFu'))).toEqual([77, 97, 110]);
    expect(toArray(decodeBase64('TQ=='))).toEqual([77]);
    // A JSON round trip can introduce newlines; they carry no data.
    expect(toArray(decodeBase64('TW\nFu'))).toEqual([77, 97, 110]);
  });
});
