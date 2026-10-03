// IssueController exposes no expert endpoint at all - no assigned-cases list, no review-submit,
// no override write. See USE_MOCK_EXPERT_QUEUE in config/env.

import type {
  ExpertCaseDetail,
  ExpertCaseSummary,
  SubmitExpertReviewFields,
} from '../types';

const NO_EXPERT_ENDPOINT = 'IssueController has no expert-facing endpoint yet.';

export async function getAssignedCases(): Promise<ExpertCaseSummary[]> {
  throw new Error(NO_EXPERT_ENDPOINT);
}

export async function getCaseDetail(_reportId: string): Promise<ExpertCaseDetail> {
  throw new Error(NO_EXPERT_ENDPOINT);
}

export async function submitReview(_fields: SubmitExpertReviewFields): Promise<void> {
  throw new Error(NO_EXPERT_ENDPOINT);
}
