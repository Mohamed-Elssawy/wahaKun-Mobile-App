// IssueService error bodies. The exception pages are kept as what the client must never match.

/** The dev exception page's text/plain body: the message, then the stack. */
function exceptionBody(message: string, frames: string[]): string {
  return [message, ...frames.map(frame => `   at ${frame}`)].join('\n');
}

/** Deliberately past parseErrorBody's 300-character slice, so the test proves the head survives. */
const DEEP_STACK = [
  'Issue.Service.Services.ExpertService.GetAllInboxAsync(IssueQueryParameters parameters, Guid expertId) in C:\\Grad-Project\\Graduation-Project\\IssueService\\Core\\Issue.Service\\Services\\ExpertService.cs:line 48',
  'Issue.Api.Controllers.ExpertController.GetInbox(IssueQueryParameters parameters) in C:\\Grad-Project\\Graduation-Project\\IssueService\\Issue.Api\\Controllers\\ExpertController.cs:line 31',
  'Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, object controller, object[] arguments)',
];

/** KeyNotFoundException from GetAllInboxAsync. An empty inbox, not a failure - §4.2 note 2, F4. */
export const EMPTY_INBOX_BODY = exceptionBody(
  'System.Collections.Generic.KeyNotFoundException: No issues were found.',
  DEEP_STACK,
);

/** A real crash. Nothing may read this as an empty result or as a refusal. */
export const UNRELATED_STACK_BODY = exceptionBody(
  'System.NullReferenceException: Object reference not set to an instance of an object.',
  DEEP_STACK,
);

/** InvalidOperationException, which a second review submission on the same case always hits. */
export const REVIEW_REFUSAL_BODY = exceptionBody(
  'System.InvalidOperationException: Only assigned issues can be reviewed.',
  DEEP_STACK,
);

/** InvalidOperationException again, from a case that was never scheduled. */
export const RESOLUTION_REFUSAL_BODY = exceptionBody(
  'System.InvalidOperationException: Resolution action can only be created for a scheduled issue.',
  DEEP_STACK,
);

/** F1: GetAllIssuesByReporterIdAsync casts a List<Guid?> to IEnumerable<Guid> on every call. */
export const FARMER_ISSUES_CRASH_BODY = exceptionBody(
  "System.InvalidCastException: Unable to cast object of type 'System.Collections.Generic.List`1[System.Nullable`1[System.Guid]]' to type 'System.Collections.Generic.IEnumerable`1[System.Guid]'.",
  DEEP_STACK,
);

// Shape D, what the deployment really returns: 500 with a zero-length body and no content-type.
export const PRODUCTION_EMPTY_BODY = '';

/** Shape A, C10 verbatim: a missing row is the only IssueService refusal that gets an envelope. */
export const ISSUE_NOT_FOUND_BODY =
  '{"status":404,"code":"ISSUE_NOT_FOUND","message":"Issue not found."}';

/** Shape B, D2 verbatim: a code, an Arabic message and a traceId. ReportService, not IssueService. */
export const INVALID_OPERATION_BODY =
  '{"status":400,"code":"INVALID_OPERATION","message":"الصورة لا تظهر مشكلة ري واضحة.","traceId":"0HNP7PBNTOAOL:00000002"}';

/** Shape C, I3 verbatim: ASP.NET's own ProblemDetails for a value that would not bind. */
export const PROBLEM_DETAILS_BODY =
  '{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Critical":["The value \'notanenum\' is not valid for Critical."]},"traceId":"00-853583af5f3e892107e25e70ffa0b16b-52eeebe6a4d8517c-00"}';

/** The JWT middleware's 401 challenge carries no body either, only WWW-Authenticate. */
export const UNAUTHORIZED_BODY = '';
