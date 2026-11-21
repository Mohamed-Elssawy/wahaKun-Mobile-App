import { ApiError } from '@/api';
import type { ForcedLocale } from '@/config/env';

import { describeAnalysisError, describeCreateError } from '../errors';

// What ReportService's ExceptionHandlingMiddleware sends for an InvalidOperationException.
function invalidOperation(message: string) {
  return ApiError.fromResponse(400, {
    code: 'INVALID_OPERATION',
    serverMessage: message,
  });
}

describe('describeAnalysisError', () => {
  it("reads analyze's INVALID_OPERATION as a refused photo, with the model's own reason", () => {
    const error = describeAnalysisError(
      invalidOperation('الصورة لا تظهر مشكلة ري واضحة.'),
      '',
    );

    expect(error.kind).toBe('unrecognized');
    expect(error.message).toBe('الصورة لا تظهر مشكلة ري واضحة.');
    // Carried raw as well, because the queue stores this and not the resolved message.
    expect(error.serverMessage).toBe('الصورة لا تظهر مشكلة ري واضحة.');
  });

  it("falls back to the generic refusal when the reason is not in the UI's script", () => {
    const error = describeAnalysisError(
      invalidOperation("The vision service couldn't analyze the image."),
      '',
    );

    expect(error.kind).toBe('unrecognized');
    expect(error.message).toBe('لم نتمكن من رؤية مشكلة واضحة في الصورة');
    // Kept even so: unreadable in this locale isn't unreadable everywhere the queue outlives it.
    expect(error.serverMessage).toBe("The vision service couldn't analyze the image.");
  });
});

describe('describeCreateError', () => {
  it("reads create's INVALID_OPERATION as a too-minor problem", () => {
    const error = describeCreateError(
      invalidOperation(
        'Issue was not created because the detected problem priority is too low.',
      ),
      '',
    );

    expect(error.kind).toBe('tooMinor');
  });

  it('keeps a validation failure as a stop, not a retry', () => {
    const error = describeCreateError(
      ApiError.fromResponse(400, {
        code: 'VALIDATION_FAILED',
        fieldErrors: { 'AiAnalysisResponse.ProblemName': ['required'] },
      }),
      '',
    );

    expect(error.kind).toBe('unknown');
  });
});

/** SPEC 16.2: re-require the module graph to resolve a different locale at init, per the test. */
function load(forced: ForcedLocale | null) {
  jest.resetModules();
  jest.doMock('@/config/env', () => ({
    ...jest.requireActual('@/config/env'),
    FORCE_LOCALE: forced,
  }));

  return require('../errors') as typeof import('../errors');
}

describe('failureMessage', () => {
  // The locale choice belongs to the read, not the write — storing the resolved sentence froze it in Arabic.
  const SERVER_REASON = 'الصورة لا تظهر مشكلة ري واضحة.';

  it("shows the server's own reason to a reader in the same script", () => {
    expect(load('ar').failureMessage('unrecognized', SERVER_REASON)).toBe(SERVER_REASON);
  });

  it("falls back to this app's copy when the stored reason is in the other script", () => {
    // E5: pins both halves — the Arabic reason is refused AND the fallback resolves in English.
    expect(load('en').failureMessage('unrecognized', SERVER_REASON)).toBe(
      "We couldn't see a clear problem in the photo.",
    );
    expect(load('ar').failureMessage('unrecognized', undefined)).toBe(
      'لم نتمكن من رؤية مشكلة واضحة في الصورة',
    );
  });

  it('answers from the kind alone when nothing was stored', () => {
    expect(load('ar').failureMessage('tooMinor')).toBe(
      'المشكلة تبدو بسيطة، ولا يحتاج هذا البلاغ إلى متابعة',
    );
  });
});
