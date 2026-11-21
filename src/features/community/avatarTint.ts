import type { ColorToken } from '@/theme';

/** Deterministic on the author id, so a farmer keeps their colour as comments page in. */
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
  // An empty id hashes to 0 and shares a tint, which is honest: we cannot tell them apart either.
  return TINTS[hash(authorId) % TINTS.length];
}
