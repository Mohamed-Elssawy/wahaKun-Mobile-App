import type { ColorToken } from '@/theme';

/**
 * A thread's avatars are tinted so two neighbouring comments read as two people at a glance.
 * F-04 samples infoTint, errorTint and successTint, so the cycle is the theme's own tints
 * rather than generated hues.
 */
// Deterministic on the author id, not the row index: a farmer keeps their colour as older
// comments page in above them.
const TINTS: readonly ColorToken[] = ['infoTint', 'errorTint', 'warningTint'];

/** Experts are always green, which is what separates them from the cycle. */
const EXPERT_TINT: ColorToken = 'successTint';

/** Modulo rather than a bitwise fold, so the running total stays a safe integer. */
const MODULUS = 2 ** 31;

function hash(value: string): number {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) % MODULUS;
  }
  return total;
}

export function avatarTintFor(authorId: string, isExpert: boolean): ColorToken {
  if (isExpert) {
    return EXPERT_TINT;
  }
  // An empty id would always hash to 0 and give every anonymous author the same tint, which
  // is the honest outcome: we cannot tell them apart either.
  return TINTS[hash(authorId) % TINTS.length];
}
