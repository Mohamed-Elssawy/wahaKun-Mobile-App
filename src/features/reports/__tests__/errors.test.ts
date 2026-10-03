import { ApiError } from '@/api';

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
  });

  it('falls back to the generic refusal when the reason is not Arabic', () => {
    const error = describeAnalysisError(
      invalidOperation("The vision service couldn't analyze the image."),
      '',
    );

    expect(error.kind).toBe('unrecognized');
    expect(error.message).toBe('لم نتمكن من رؤية مشكلة واضحة في الصورة');
  });
});

describe('describeCreateError', () => {
  it("reads create's INVALID_OPERATION as a too-minor problem", () => {
    const error = describeCreateError(
      invalidOperation('Issue was not created because the detected problem priority is too low.'),
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
