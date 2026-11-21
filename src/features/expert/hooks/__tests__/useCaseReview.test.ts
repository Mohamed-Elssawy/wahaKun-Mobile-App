import { act, create } from 'react-test-renderer';

import { useCaseReview } from '../useCaseReview';

import type { ExpertCaseDetail } from '../../types';

// React Native's act environment flag, so the async state updates below are not warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockGetCaseDetail = jest.fn();
const mockSubmitReview = jest.fn();
const mockPostComment = jest.fn();

jest.mock('../../services', () => ({
  expertApi: {
    getCaseDetail: (...args: unknown[]) => mockGetCaseDetail(...args),
    submitReview: (...args: unknown[]) => mockSubmitReview(...args),
  },
}));

jest.mock('@/features/community/services', () => ({
  communityApi: { postComment: (...args: unknown[]) => mockPostComment(...args) },
}));

// react-test-renderer has no renderHook; this is the smallest harness that reads the hook live.
function renderHook<T>(useHook: () => T) {
  const result = { current: undefined as unknown as T };
  function Harness() {
    result.current = useHook();
    return null;
  }
  act(() => {
    create(require('react').createElement(Harness));
  });
  return { result };
}

const flush = () => act(async () => {});

/** Node 3: routed, nothing reviewed yet. T4 is available. */
const AWAITING_REVIEW: ExpertCaseDetail = {
  reportId: '2001',
  title: 'تسريب في القناة الرئيسية',
  severity: 'حرجة',
  confidence: 0.96,
  corroborationCount: 0,
  reporterName: 'مزارع',
  createdAt: new Date(2025, 0, 1).toISOString(),
  status: 'UnderReview',
  hasAiAnalysis: true,
  hasExpertReview: false,
  hasAppointment: false,
  hasRepairConfirmation: false,
};

/** Node 4: the review has landed and the case is waiting to be scheduled. */
const ALREADY_REVIEWED: ExpertCaseDetail = {
  ...AWAITING_REVIEW,
  hasExpertReview: true,
};

/** Closed. Neither T4 nor T5 is available, so the primary must refuse rather than advance. */
const CLOSED: ExpertCaseDetail = {
  ...ALREADY_REVIEWED,
  status: 'Resolved',
  hasAppointment: true,
  hasRepairConfirmation: true,
};

beforeEach(() => {
  mockGetCaseDetail.mockReset();
  mockSubmitReview.mockReset();
  mockPostComment.mockReset();
});

describe('useCaseReview - submitting from E-03s قرار الخبير link', () => {
  it('sends the review and reports success on a case that has none', async () => {
    mockGetCaseDetail.mockResolvedValue(AWAITING_REVIEW);
    mockSubmitReview.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCaseReview('2001'));
    await flush();

    let didSubmit = false;
    await act(async () => {
      didSubmit = await result.current.submit();
    });

    expect(didSubmit).toBe(true);
    expect(mockSubmitReview).toHaveBeenCalledTimes(1);
    expect(result.current.submitError).toBeNull();
  });

  // T4 rightly refuses a second review, so the screen must advance and send nothing.
  it('advances without a second write when the review has already landed', async () => {
    mockGetCaseDetail.mockResolvedValue(ALREADY_REVIEWED);

    const { result } = renderHook(() => useCaseReview('2001'));
    await flush();

    let didSubmit = false;
    await act(async () => {
      didSubmit = await result.current.submit();
    });

    expect(didSubmit).toBe(true);
    expect(mockSubmitReview).not.toHaveBeenCalled();
    expect(result.current.submitError).toBeNull();
  });

  // The advance is keyed to "T5 is available", not to "T4 refused", so a closed case still stops.
  it('still refuses on a case that can neither be reviewed nor scheduled', async () => {
    mockGetCaseDetail.mockResolvedValue(CLOSED);

    const { result } = renderHook(() => useCaseReview('2001'));
    await flush();

    let didSubmit = true;
    await act(async () => {
      didSubmit = await result.current.submit();
    });

    expect(didSubmit).toBe(false);
    expect(mockSubmitReview).not.toHaveBeenCalled();
    expect(result.current.submitError).not.toBeNull();
  });
});
