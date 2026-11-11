import { act, create } from 'react-test-renderer';

import { useScheduleRepair } from '../useScheduleRepair';

import type { ExpertCaseDetail } from '../../types';

// React Native's act environment flag, so the async state updates below are not warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockGetCaseDetail = jest.fn();
const mockConfirmAppointment = jest.fn();

jest.mock('../../services', () => ({
  expertApi: {
    getCaseDetail: (...args: unknown[]) => mockGetCaseDetail(...args),
    confirmAppointment: (...args: unknown[]) => mockConfirmAppointment(...args),
  },
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

/** No appointment payload, which isolates the reason gate from the pre-selection effect. */
const RESCHEDULE_NO_APPOINTMENT: ExpertCaseDetail = {
  reportId: '2006',
  title: 'كسر في أنبوب الصرف الثانوي',
  severity: 'متوسطة',
  confidence: 0.9,
  corroborationCount: 0,
  reporterName: 'عبير سامي',
  createdAt: new Date(2025, 0, 1).toISOString(),
  status: 'Scheduled',
  hasAiAnalysis: true,
  hasExpertReview: true,
  hasAppointment: true,
  hasRepairConfirmation: false,
};

const UNDER_REVIEW_READY: ExpertCaseDetail = {
  ...RESCHEDULE_NO_APPOINTMENT,
  status: 'UnderReview',
  hasAppointment: false,
};

beforeEach(() => {
  mockGetCaseDetail.mockReset();
  mockConfirmAppointment.mockReset();
});

describe('useScheduleRepair - سبب التغيير requirement', () => {
  it('requires a reason only on a reschedule, and أخرى needs its free text too', async () => {
    mockGetCaseDetail.mockResolvedValue(RESCHEDULE_NO_APPOINTMENT);

    const { result } = renderHook(() => useScheduleRepair('2006'));
    await flush();

    act(() => {
      result.current.selectDate('2026-01-10');
    });
    act(() => {
      result.current.setSelectedSlot('9:00 ص');
    });

    expect(result.current.isReschedule).toBe(true);
    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.setReasonChip('أخرى');
    });
    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.setReasonNote('سبب آخر لم يرد في القائمة');
    });
    expect(result.current.canSubmit).toBe(true);

    act(() => {
      result.current.setReasonChip('ظروف الطقس');
    });
    expect(result.current.canSubmit).toBe(true);
  });

  it('does not require a reason on the first scheduling', async () => {
    mockGetCaseDetail.mockResolvedValue(UNDER_REVIEW_READY);

    const { result } = renderHook(() => useScheduleRepair('2006'));
    await flush();

    act(() => {
      result.current.selectDate('2025-01-02');
    });
    act(() => {
      result.current.setSelectedSlot('9:00 ص');
    });

    expect(result.current.isReschedule).toBe(false);
    expect(result.current.canSubmit).toBe(true);
  });
});

describe('useScheduleRepair - C-WINDOW restarts from today on a reschedule', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('windows off today, not the filing date, crossing into the next month', async () => {
    // The filing date is kept far in the past so a regression to windowing off createdAt fails loudly.
    jest.spyOn(Date, 'now').mockReturnValue(new Date(2026, 0, 30, 10, 0, 0).getTime());

    mockGetCaseDetail.mockResolvedValue(RESCHEDULE_NO_APPOINTMENT);

    const { result } = renderHook(() => useScheduleRepair('2006'));
    await flush();

    expect(result.current.enabledDates).toEqual([
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
      '2026-02-02',
      '2026-02-03',
      '2026-02-04',
      '2026-02-05',
    ]);
  });
});
