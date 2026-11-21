import { ESCALATE_LOW_CONFIDENCE } from '@/config/env';

import { showsAiBlock } from './lifecycle';

import type { Audience } from './lifecycle';

export type FarmerAiInput = {
  /** 0 to 1, as normalizeConfidence leaves it. */
  confidence: number;
  /** PROPOSED: no Report field says whether an expert has reviewed, so callers leave it off. */
  hasExpertReview?: boolean;
  transcriptionFailed?: boolean;
};

/** The one place the escalation flag is read outside config/env, so no screen holds the rule. */
export function seesAi(
  audience: Audience,
  { confidence, hasExpertReview = false, transcriptionFailed }: FarmerAiInput,
): boolean {
  return showsAiBlock({
    audience,
    confidence,
    hasExpertReview,
    transcriptionFailed,
    escalateLowConfidence: ESCALATE_LOW_CONFIDENCE,
  });
}

/** The farmer's side of `seesAi`, which is every call site that is not an expert screen. */
export function farmerSeesAi(input: FarmerAiInput): boolean {
  return seesAi('farmer', input);
}
