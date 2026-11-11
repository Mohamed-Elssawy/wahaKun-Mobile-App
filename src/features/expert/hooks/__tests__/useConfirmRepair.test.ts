import { act, create } from 'react-test-renderer';

import { useConfirmRepair } from '../useConfirmRepair';

import type { ExpertCaseDetail } from '../../types';

// React Native's act environment flag, so the async state updates below are not warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockGetCaseDetail = jest.fn();
const mockConfirmRepair = jest.fn();

jest.mock('../../services', () => ({
  expertApi: {
    getCaseDetail: (...args: unknown[]) => mockGetCaseDetail(...args),
    confirmRepair: (...args: unknown[]) => mockConfirmRepair(...args),
  },
}));

const PHOTO = {
  uri: 'file:///cache/repair.jpg',
  type: 'image/png',
  fileName: 'repair.png',
};

jest.mock('@/hooks/useImagePicker', () => ({
  useImagePicker: () => ({
    image: PHOTO,
    error: '',
    pickFromCamera: jest.fn(),
    pickFromGallery: jest.fn(),
  }),
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

/** T6 refuses a case already repair-confirmed - the cheapest way to force `attempt(...)` to fail. */
const ALREADY_CONFIRMED: ExpertCaseDetail = {
  reportId: '2006',
  title: 'كسر في أنبوب الصرف الثانوي',
  severity: 'منخفضة',
  confidence: 0.9,
  corroborationCount: 0,
  reporterName: 'عبير سامي',
  createdAt: new Date().toISOString(),
  status: 'Scheduled',
  hasAiAnalysis: true,
  hasExpertReview: true,
  hasAppointment: true,
  hasRepairConfirmation: true,
};

beforeEach(() => {
  mockGetCaseDetail.mockReset();
  mockConfirmRepair.mockReset();
});

describe('useConfirmRepair - D9', () => {
  it('sets an error when the lifecycle refuses, instead of failing silently', async () => {
    mockGetCaseDetail.mockResolvedValue(ALREADY_CONFIRMED);

    const { result } = renderHook(() => useConfirmRepair('2006'));
    await flush();

    act(() => {
      result.current.setNotes('تم الإصلاح');
    });

    let didSubmit: boolean | undefined;
    await act(async () => {
      didSubmit = await result.current.submit();
    });

    expect(didSubmit).toBe(false);
    expect(result.current.submitError).not.toBeNull();
    expect(mockConfirmRepair).not.toHaveBeenCalled();
  });
});
