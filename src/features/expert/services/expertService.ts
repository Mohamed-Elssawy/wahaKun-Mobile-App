/** ExpertController on IssueService; every action is role-guarded, hence authenticated: true. */

// classifyExpertError branches on shape (code, then status, then body), never on server copy.

import { API_ENDPOINTS, ApiError, apiClient } from '@/api';
import { API_BASE_URLS, LOG_API_ERRORS, UPLOAD_TIMEOUT_MS } from '@/config/env';
import { factsFromWireStatus } from '@/features/reports/lifecycle';
import type { LifecycleFacts } from '@/features/reports/lifecycle';
import {
  STORAGE_SERVES_BYTES,
  buildAnalyzeFormData,
  stripModelSections,
  normalizeConfidence,
  resolveAttachmentUrl,
  toUtcTimestamp,
} from '@/features/reports/services/reportService';
import { severityFromPriority } from '@/features/reports/severity';
import type { ReportStatus, Severity } from '@/features/reports/types';

import type {
  CaseReviewWire,
  ConfirmAppointmentFields,
  ConfirmRepairFields,
  ExpertCaseDetail,
  ExpertCaseSummary,
  ExpertInboxRowWire,
  ExpertPaginatedWire,
  ExpertReviewOverride,
  ExpertReviewWire,
  IssueAttachmentWire,
  ScheduleRepairBody,
  ScheduleSlot,
  SubmitExpertReviewFields,
  SubmitReviewBody,
} from '../types';

/** IssueStatus, verbatim. `completed` is lowercase in the C# source. */
const WIRE_STATUS_VALUES: ReadonlySet<string> = new Set([
  'Reported',
  'Diagnosed',
  'Assigned',
  'Reviewed',
  'Scheduled',
  'Repaired',
  'completed',
]);

/** The expert flow cannot reach Scheduled without a review, whatever the endpoint would allow. */
const REVIEWED_OR_LATER: ReadonlySet<string> = new Set([
  'Reviewed',
  'Scheduled',
  'Repaired',
  'completed',
]);

const warnedStatuses = new Set<string>();

/** Once per distinct value: an unknown status on a 50-row inbox is one line, not fifty. */
function warnUnknownStatus(status: string): void {
  if (!LOG_API_ERRORS || warnedStatuses.has(status)) {
    return;
  }
  warnedStatuses.add(status);
  console.warn(`[expertService] unknown IssueStatus "${status}", reading it as New`);
}

/** The expert knows more than the shared facts: a case past Reviewed was reviewed. */
export function expertFacts(status: ReportStatus, reviewCount: number): LifecycleFacts {
  if (!WIRE_STATUS_VALUES.has(status)) {
    warnUnknownStatus(status);
  }

  return {
    ...factsFromWireStatus(status),
    hasExpertReview: reviewCount > 0 || REVIEWED_OR_LATER.has(status),
  };
}

const PHOTO_ATTACHMENT = new Set<IssueAttachmentWire['type']>([0, 'Photo']);

// G4: attachments[] has no purpose, so order decides: first is the problem, last is the proof.
export function problemPhotoAttachment(
  attachments: IssueAttachmentWire[],
): IssueAttachmentWire | undefined {
  return attachments.find(attachment => PHOTO_ATTACHMENT.has(attachment.type));
}

/** The farmer's own photo, or nothing when storage cannot serve its bytes. */
function problemPhotoUrl(attachments: IssueAttachmentWire[]): string | undefined {
  const photo = problemPhotoAttachment(attachments);
  if (!photo || !STORAGE_SERVES_BYTES) {
    return undefined;
  }
  return resolveAttachmentUrl(photo.url);
}

// G3: the request is (Decision, Notes) only, so severity and diagnosis ride inside notes.
const OVERRIDE_PREFIX = '[تصحيح]';
const OVERRIDE_SEPARATOR = '|';

/** `[تصحيح] <correctedDiagnosis> | <severity>` then the note, either line optional. */
export function composeReviewNotes(fields: SubmitExpertReviewFields): string | null {
  const lines: string[] = [];

  if (fields.override) {
    const { correctedDiagnosis, severity } = fields.override;
    lines.push(
      `${OVERRIDE_PREFIX} ${correctedDiagnosis} ${OVERRIDE_SEPARATOR} ${severity}`,
    );
  }

  if (fields.expertNote) {
    lines.push(fields.expertNote);
  }

  return lines.length > 0 ? lines.join('\n') : null;
}

export type ParsedReviewNotes = {
  override?: ExpertReviewOverride;
  expertNote?: string;
};

// BACKEND-GAP G3: the read half of composeReviewNotes.
export function parseReviewNotes(notes: string | null | undefined): ParsedReviewNotes {
  const text = notes?.trim();
  if (!text) {
    return {};
  }

  // Only the first newline: an expert note of several lines has to survive the round trip.
  const breakAt = text.indexOf('\n');
  const head = breakAt === -1 ? text : text.slice(0, breakAt);
  const rest = breakAt === -1 ? '' : text.slice(breakAt + 1);

  if (!head.startsWith(OVERRIDE_PREFIX)) {
    return { expertNote: text };
  }

  // Last separator, not first: a diagnosis may contain a pipe and no severity value does.
  const body = head.slice(OVERRIDE_PREFIX.length);
  const splitAt = body.lastIndexOf(OVERRIDE_SEPARATOR);
  const correctedDiagnosis = splitAt === -1 ? '' : body.slice(0, splitAt).trim();
  const severity = splitAt === -1 ? '' : body.slice(splitAt + 1).trim();

  // Never half an override: ExpertReviewOverride requires both, and E-02 pre-fills from it.
  if (!correctedDiagnosis || !severity) {
    return { expertNote: text };
  }

  return {
    override: { severity: severity as Severity, correctedDiagnosis },
    expertNote: rest.trim() || undefined,
  };
}

/** Sent as the integer, which the converter still binds; read back in either form. */
const OVERRIDE_DECISION = 1;
const isOverride = (review: ExpertReviewWire) =>
  review.decision === OVERRIDE_DECISION || review.decision === 'Override';

/** Newest last. previousReview cannot occur yet: nothing reopens a case (G2). */
function toReviewHistory(reviews: ExpertReviewWire[]): {
  currentOverride?: ExpertReviewOverride;
  previousReview?: ExpertReviewOverride & { expertNote?: string };
} {
  const ordered = [...reviews].sort(
    (a, b) =>
      Date.parse(toUtcTimestamp(a.reviewedAt)) - Date.parse(toUtcTimestamp(b.reviewedAt)),
  );

  const latest = ordered.length > 0 ? ordered[ordered.length - 1] : undefined;
  const prior = ordered.length > 1 ? ordered[ordered.length - 2] : undefined;

  const current =
    latest && isOverride(latest) ? parseReviewNotes(latest.notes).override : undefined;

  const before = prior && isOverride(prior) ? parseReviewNotes(prior.notes) : undefined;

  return {
    currentOverride: current,
    previousReview: before?.override
      ? { ...before.override, expertNote: before.expertNote }
      : undefined,
  };
}

// G7: no endpoint resolves a user by id, so the card names no one rather than inventing a farmer.
const REPORTER_PLACEHOLDER = 'مزارع';

/** E-01's card. `detail` is null when the fan-out's call for this row failed. */
export function toCaseSummary(
  row: ExpertInboxRowWire,
  detail: CaseReviewWire | null,
): ExpertCaseSummary {
  const analysis = detail?.aiAnalysis ?? null;

  return {
    ...expertFacts(row.status, detail?.expertReviews.length ?? 0),
    reportId: row.id,
    title: row.title,
    createdAt: toUtcTimestamp(row.createdAt),
    severity: analysis?.severity || severityFromPriority(row.priority),
    // A missing analysis reads as the amber chip: failing toward trust this less is the safe way.
    confidence: analysis ? normalizeConfidence(analysis.confidence) : 0,
    photoUrl: detail ? problemPhotoUrl(detail.attachments) : undefined,
    reporterName: REPORTER_PLACEHOLDER,
    // BACKEND-GAP G5: no corroboration count exists on any endpoint.
    corroborationCount: 0,
  };
}

/** Built on toCaseSummary so the card and the screen can never disagree. */
export function toCaseDetail(wire: CaseReviewWire): ExpertCaseDetail {
  const analysis = wire.aiAnalysis;

  return {
    ...toCaseSummary(wire, wire),
    // All three carry the model's section dump; see stripModelSections for what it is.
    explanation: analysis?.explanation
      ? stripModelSections(analysis.explanation)
      : undefined,
    recommendation: analysis ? stripModelSections(analysis.recommendation) : undefined,
    // Sent on the wire and dropped until now, which is why E-11 had no steps to draw.
    repairSteps: analysis?.repairSteps ?? [],
    description: wire.description ? stripModelSections(wire.description) : undefined,
    ...toReviewHistory(wire.expertReviews),
    // G4/G9: the payload carries neither the schedule nor the purpose, so both are unreadable.
  };
}

/** Shape D: an unwrapped refusal. A 500 with no body and no `content-type` at all. */
const REFUSAL_STATUS = 500;

/** C13: the role guard answers from middleware, before the controller, with an empty body. */
const FORBIDDEN_STATUS = 403;

/** The only two `code` values seen in 120 probe calls. Both are already in CODE_MESSAGES. */
const ISSUE_NOT_FOUND = 'ISSUE_NOT_FOUND';
const INVALID_OPERATION = 'INVALID_OPERATION';

/** Taken from endpoints.ts and matched case-insensitively: no branch may turn on path casing. */
const EXPERT_SEGMENT = API_ENDPOINTS.issue
  .review('id')
  .split('/')
  .filter(Boolean)[0]
  .toLowerCase();

function isExpertRoute(error: ApiError): boolean {
  return (error.details.url ?? '').toLowerCase().includes(`/${EXPERT_SEGMENT}/`);
}

/** Shape D has neither. `client.ts` leaves both unset when the response body is zero-length. */
function hasEmptyBody(error: ApiError): boolean {
  return error.details.body == null && !error.details.serverMessage;
}

const warnedCodes = new Set<string>();

/** Two codes have ever been observed; grep UNKNOWN_CODE to find what to add to the table. */
function warnUnknownCode(error: ApiError): void {
  const code = error.code ?? '';
  if (!LOG_API_ERRORS || warnedCodes.has(code)) {
    return;
  }
  warnedCodes.add(code);
  console.warn(
    `[expertService] UNKNOWN_CODE "${code}" on ${error.details.url ?? 'an unknown route'} - only ` +
      'ISSUE_NOT_FOUND and INVALID_OPERATION have ever been observed; record it in REFERENCE-NOTES.md',
  );
}

// Three causes produce this identical response; read as the refusal a signed-in expert really hits.
function warnNotAssignedOrCrashed(error: ApiError): void {
  if (!LOG_API_ERRORS) {
    return;
  }
  console.warn(
    `[expertService] 500 with no body on ${error.details.url ?? 'an /Expert route'} - this expert ` +
      'is not assigned to the case (PROBE I5), or the issue does not exist (C11), or IssueService ' +
      'crashed unwrapped. Indistinguishable on the wire; read as the refusal.',
  );
}

/** What an IssueService refusal is, by shape. Every branch carries the row that observed it. */
export type ExpertRefusal =
  /** 4xx envelope. Never observed on /Expert/*: tolerance for a deployment that starts wrapping. */
  | 'issueNotFound'
  /** 4xx + `{status, code, message, traceId}`. D2: `400`, the only other code ever seen. */
  | 'invalidOperation'
  /** 403, empty body, from middleware. C13: a farmer's token, on BOTH expert reads. */
  | 'wrongRole'
  /** 500, empty body, on `/Expert/*`. I5 and C11 - and see `warnNotAssignedOrCrashed`. */
  | 'notAssigned'
  /** Everything else, including a code this build has never seen. Generic Arabic. */
  | 'unknown';

/** code first, then status, then body shape. Never the message text: that is what broke. */
export function classifyExpertError(error: unknown): ExpertRefusal {
  if (!(error instanceof ApiError)) {
    return 'unknown';
  }

  if (error.code === ISSUE_NOT_FOUND) {
    return 'issueNotFound';
  }
  if (error.code === INVALID_OPERATION) {
    return 'invalidOperation';
  }
  // A code at all means the server told us what happened in a vocabulary we do not know yet.
  if (error.code) {
    warnUnknownCode(error);
    return 'unknown';
  }

  if (error.status === FORBIDDEN_STATUS && hasEmptyBody(error)) {
    return 'wrongRole';
  }

  if (error.status === REFUSAL_STATUS && hasEmptyBody(error) && isExpertRoute(error)) {
    warnNotAssignedOrCrashed(error);
    return 'notAssigned';
  }

  return 'unknown';
}

/** The six fixed slots as the TimeOnly pair. Two hours each is this app's assumption. */
export const SLOT_TIMES: Record<ScheduleSlot, { slotStart: string; slotEnd: string }> = {
  '7:00 ص': { slotStart: '07:00:00', slotEnd: '09:00:00' },
  '9:00 ص': { slotStart: '09:00:00', slotEnd: '11:00:00' },
  '11:00 ص': { slotStart: '11:00:00', slotEnd: '13:00:00' },
  '1:00 م': { slotStart: '13:00:00', slotEnd: '15:00:00' },
  '3:00 م': { slotStart: '15:00:00', slotEnd: '17:00:00' },
  '5:00 م': { slotStart: '17:00:00', slotEnd: '19:00:00' },
};

const BASE = API_BASE_URLS.issue;

/** Ten is the top of §4.2's documented [5, 10] clamp, which remains unobserved. */
const PAGE_SIZE = 10;

/** 1 = date ascending, 2 = date descending. */
const SORT_NEWEST_FIRST = 2;

// No server-side status filter, so closed cases page alongside live ones; five pages is the cap.
const MAX_PAGES = 5;
const MAX_ROWS = PAGE_SIZE * MAX_PAGES;

/** Ten detail calls in flight at once: fifty is fine against localhost and not on a device. */
const DETAIL_CHUNK = 10;

function fetchCaseReview(reportId: string): Promise<CaseReviewWire> {
  return apiClient.get<CaseReviewWire>(BASE, API_ENDPOINTS.issue.review(reportId), {
    authenticated: true,
  });
}

/** Pages off totalCount, never pageCount, which is ceil(resultsOnThisPage / PageSize). */
async function fetchAssignedRows(): Promise<ExpertInboxRowWire[]> {
  const rows: ExpertInboxRowWire[] = [];

  for (let pageIndex = 1; pageIndex <= MAX_PAGES; pageIndex += 1) {
    let page: ExpertPaginatedWire<ExpertInboxRowWire>;

    try {
      page = await apiClient.get<ExpertPaginatedWire<ExpertInboxRowWire>>(
        BASE,
        API_ENDPOINTS.issue.inbox(PAGE_SIZE, pageIndex, SORT_NEWEST_FIRST),
        { authenticated: true },
      );
    } catch (error) {
      // Page one rethrows: an empty list and a broken list must not look identical.
      if (classifyExpertError(error) === 'issueNotFound') {
        return rows;
      }
      if (pageIndex > 1) {
        if (LOG_API_ERRORS) {
          console.warn(
            `[expertService] inbox page ${pageIndex} failed after ${rows.length} rows; serving those`,
          );
        }
        return rows;
      }
      throw error;
    }

    rows.push(...page.results);

    // A short page that did not throw is the server running out early.
    if (
      page.results.length === 0 ||
      rows.length >= page.totalCount ||
      rows.length >= MAX_ROWS
    ) {
      break;
    }
  }

  return rows.slice(0, MAX_ROWS);
}

/** Chunked, and a rejected detail is never fatal: toCaseSummary has a degraded branch. */
async function fetchDetailsInChunks(ids: string[]): Promise<Map<string, CaseReviewWire>> {
  const details = new Map<string, CaseReviewWire>();
  let failures = 0;

  for (let start = 0; start < ids.length; start += DETAIL_CHUNK) {
    const chunk = ids.slice(start, start + DETAIL_CHUNK);
    const settled = await Promise.allSettled(chunk.map(fetchCaseReview));

    settled.forEach((result, index) => {
      const id = chunk[index];
      if (result.status === 'fulfilled') {
        details.set(id, result.value);
      } else {
        failures += 1;
      }
    });
  }

  // One line per load, not one per failure: an unreachable server would write fifty.
  if (failures > 0 && LOG_API_ERRORS) {
    console.warn(
      `[expertService] ${failures} of ${ids.length} case details failed to load`,
    );
  }

  return details;
}

/** One page call, then a chunked detail fan-out: the row carries no confidence or photo (G5/G6). */
export async function getAssignedCases(): Promise<ExpertCaseSummary[]> {
  const rows = await fetchAssignedRows();
  if (rows.length === 0) {
    return [];
  }

  const details = await fetchDetailsInChunks(rows.map(row => row.id));
  return rows.map(row => toCaseSummary(row, details.get(row.id) ?? null));
}

export async function getCaseDetail(reportId: string): Promise<ExpertCaseDetail> {
  return toCaseDetail(await fetchCaseReview(reportId));
}

const CONFIRM_AI_DECISION = 0;
const CONFLICT_STATUS = 409;

/** 409 tells the expert this may already be done; a 500 would tell them to retry forever. */
function asConflict(error: ApiError): ApiError {
  return ApiError.fromResponse(CONFLICT_STATUS, error.details);
}

// UNVERIFIED: no write was ever exercised, so a status-guard refusal has never been observed.
function isStatusGuardRefusal(error: unknown): error is ApiError {
  const refusal = classifyExpertError(error);
  return refusal === 'invalidOperation' || refusal === 'notAssigned';
}

/** T4. The server refuses unless the status is exactly `Assigned`. */
export async function submitReview(fields: SubmitExpertReviewFields): Promise<void> {
  const body: SubmitReviewBody = {
    decision: fields.override ? OVERRIDE_DECISION : CONFIRM_AI_DECISION,
    notes: composeReviewNotes(fields),
  };

  try {
    await apiClient.post<unknown>(
      BASE,
      API_ENDPOINTS.issue.submitReview(fields.reportId),
      body,
      { authenticated: true },
    );
  } catch (error) {
    // UNVERIFIED - see isStatusGuardRefusal. The server refuses unless the status is `Assigned`.
    if (isStatusGuardRefusal(error)) {
      throw asConflict(error);
    }
    throw error;
  }
}

/** T5. Every call inserts a new RepairSchedule row rather than updating the existing one. */
export async function confirmAppointment(
  fields: ConfirmAppointmentFields,
): Promise<void> {
  const body: ScheduleRepairBody = {
    scheduledDate: fields.date,
    ...SLOT_TIMES[fields.slot],
    farmerNotified: true,
    notes: fields.noteToFarmer ?? null,
  };

  await apiClient.post<unknown>(
    BASE,
    API_ENDPOINTS.issue.schedule(fields.reportId),
    body,
    {
      authenticated: true,
    },
  );
}

/** T6. multipart/form-data with parts Photo and Notes. Refused unless the status is Scheduled. */
export async function confirmRepair(fields: ConfirmRepairFields): Promise<void> {
  // Reused rather than rebuilt: buildAnalyzeFormData owns the MIME map both uploads share.
  const formData = buildAnalyzeFormData(fields.photo);
  formData.append('Notes', fields.notes);

  try {
    await apiClient.post<unknown>(
      BASE,
      API_ENDPOINTS.issue.resolution(fields.reportId),
      formData,
      {
        authenticated: true,
        // Aborting a multipart body the server is still writing is what makes duplicates.
        timeoutMs: UPLOAD_TIMEOUT_MS,
      },
    );
  } catch (error) {
    // UNVERIFIED - see isStatusGuardRefusal. The server refuses unless the status is `Scheduled`.
    if (isStatusGuardRefusal(error)) {
      throw asConflict(error);
    }
    throw error;
  }
}
