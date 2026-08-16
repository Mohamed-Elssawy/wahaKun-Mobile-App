/* eslint-disable no-bitwise -- base64 is bit packing; the rule has nothing to catch here. */

// React Native ships no `btoa`, `atob` or `Buffer`, and photoStore is the only consumer.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Reverse lookup: charCode -> 6-bit value. Built once; `indexOf` per byte is O(n²). */
const LOOKUP = new Uint8Array(128);
for (let i = 0; i < ALPHABET.length; i += 1) {
  LOOKUP[ALPHABET.charCodeAt(i)] = i;
}

export function encodeBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const parts: string[] = [];

  for (let i = 0; i < bytes.length; i += 3) {
    const remaining = bytes.length - i;
    const b0 = bytes[i];
    const b1 = remaining > 1 ? bytes[i + 1] : 0;
    const b2 = remaining > 2 ? bytes[i + 2] : 0;

    parts.push(ALPHABET[b0 >> 2]);
    parts.push(ALPHABET[((b0 & 0b11) << 4) | (b1 >> 4)]);
    parts.push(remaining > 1 ? ALPHABET[((b1 & 0b1111) << 2) | (b2 >> 6)] : '=');
    parts.push(remaining > 2 ? ALPHABET[b2 & 0b111111] : '=');
  }

  // Joining beats `out +=`: a 200KB photo would reallocate about 270,000 times.
  return parts.join('');
}

export function decodeBase64(value: string): ArrayBuffer {
  // Padding carries no data, and whitespace can survive a JSON round trip.
  const clean = value.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let out = 0;

  for (let i = 0; i < clean.length; i += 4) {
    const remaining = clean.length - i;
    const c0 = LOOKUP[clean.charCodeAt(i)];
    const c1 = remaining > 1 ? LOOKUP[clean.charCodeAt(i + 1)] : 0;
    const c2 = remaining > 2 ? LOOKUP[clean.charCodeAt(i + 2)] : 0;
    const c3 = remaining > 3 ? LOOKUP[clean.charCodeAt(i + 3)] : 0;

    bytes[out] = (c0 << 2) | (c1 >> 4);
    out += 1;
    if (remaining > 2) {
      bytes[out] = ((c1 & 0b1111) << 4) | (c2 >> 2);
      out += 1;
    }
    if (remaining > 3) {
      bytes[out] = ((c2 & 0b11) << 6) | c3;
      out += 1;
    }
  }

  return bytes.buffer;
}
