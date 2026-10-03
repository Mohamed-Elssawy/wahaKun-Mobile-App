import { ESCALATE_LOW_CONFIDENCE } from '@/config/env';

import { showsAiBlock } from './lifecycle';

export type FarmerAiInput = {
  /** 0 to 1, as normalizeConfidence leaves it. */
  confidence: number;
  /** PROPOSED: no Report field says whether an expert has reviewed, so callers leave it off. */
  hasExpertReview?: boolean;
  transcriptionFailed?: boolean;
};

/**
 * Whether this farmer may see the AI block at all. The one place the escalation flag is read
 * outside config/env, so the model stays pure and no screen holds the rule for itself.
 */
export function farmerSeesAi({
  confidence,
  hasExpertReview = false,
  transcriptionFailed,
}: FarmerAiInput): boolean {
  return showsAiBlock({
    audience: 'farmer',
    confidence,
    hasExpertReview,
    transcriptionFailed,
    escalateLowConfidence: ESCALATE_LOW_CONFIDENCE,
  });
}
