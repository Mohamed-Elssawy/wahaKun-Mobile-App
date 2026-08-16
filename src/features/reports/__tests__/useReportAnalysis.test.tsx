import { act, create } from 'react-test-renderer';

import { ApiError } from '@/api';

import { useReportAnalysis } from '../hooks/useReportAnalysis';

const mockGetReportById = jest.fn();
const mockAnalyzeReport = jest.fn();
const mockDeleteReport = jest.fn();

jest.mock('../services', () => ({
  reportApi: {
    getReportById: (...args: unknown[]) => mockGetReportById(...args),
    analyzeReport: (...args: unknown[]) => mockAnalyzeReport(...args),
    deleteReport: (...args: unknown[]) => mockDeleteReport(...args),
  },
}));

const PENDING = {
  id: 'r1',
  status: 'Pending',
  createdAt: '2026-08-10T13:36:42.813Z',
  reporterId: 'f86295b1',
  attachments: [],
};

/** The developer exception page ReportService answers with, trimmed to its first line. */
const refusal = () =>
  new ApiError(
    'Request failed with status 500',
    500,
    'System.InvalidOperationException: لم يتم الكشف عن مشكلة واضحة في الصورة.\n' +
      '   at Report.Service.Services.ReportService.AnalyzeReportAsync(Guid id)',
  );

let hook: ReturnType<typeof useReportAnalysis>;

function Probe({ reportId }: { reportId: string }) {
  hook = useReportAnalysis(reportId);
  return null;
}

const mount = async (reportId = 'r1') => {
  await act(async () => {
    create(<Probe reportId={reportId} />);
  });
};

describe('useReportAnalysis', () => {
  beforeEach(() => {
    mockGetReportById.mockReset();
    mockAnalyzeReport.mockReset();
    mockDeleteReport.mockReset();
    mockDeleteReport.mockResolvedValue(undefined);
  });

  it('reads a refused photo as its own kind, not as a server failure', async () => {
    mockGetReportById.mockResolvedValue(PENDING);
    mockAnalyzeReport.mockRejectedValue(refusal());

    await mount();

    expect(hook.error?.kind).toBe('unrecognized');
  });

  it('leaves a real 500 as a failure a retry can still fix', async () => {
    mockGetReportById.mockResolvedValue(PENDING);
    // No body at all: a published backend, or any failure that is not the model.
    mockAnalyzeReport.mockRejectedValue(new ApiError('boom', 500));

    await mount();

    expect(hook.error?.kind).toBe('unknown');
  });

  it('deletes the refused report once, however many exits are taken', async () => {
    mockGetReportById.mockResolvedValue(PENDING);
    mockAnalyzeReport.mockRejectedValue(refusal());

    await mount();

    // The camera, then back: both leave F-03c, and the row must not outlive either.
    act(() => hook.discard());
    act(() => hook.discard());

    expect(mockDeleteReport).toHaveBeenCalledTimes(1);
    expect(mockDeleteReport).toHaveBeenCalledWith('r1');
  });

  it('swallows a failed cleanup rather than surfacing it', async () => {
    mockGetReportById.mockResolvedValue(PENDING);
    mockAnalyzeReport.mockRejectedValue(refusal());
    mockDeleteReport.mockRejectedValue(new ApiError('offline', 0));

    await mount();

    await act(async () => {
      hook.discard();
    });

    // The error the farmer sees is still the refusal, not the delete that failed.
    expect(hook.error?.kind).toBe('unrecognized');
  });
});
