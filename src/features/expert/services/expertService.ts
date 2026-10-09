/** ExpertController on IssueService (PORTS.issue). Every action is [Authorize(Roles = "Expert")],
 * hence `authenticated: true` throughout. */

// IssueService registers no exception middleware, so every refusal and every empty result
// arrives as a bare 500 with the exception text in the body. The three message matches below
// are the only place this app branches on server copy, against the rule in ARCHITECTURE.md.
// They work only because ASPNETCORE_ENVIRONMENT=Development echoes the message at all; under
// any other environment the body is empty. See BACKEND-GAPS-FOR-TEAMMATE.md item 6, which is
// the one change that deletes all three.

import { API_ENDPOINTS, ApiError, apiClient } from '@/api';
import { API_BASE_URLS, LOG_API_ERRORS, UPLOAD_TIMEOUT_MS } from '@/config/env';
import { factsFromWireStatus } from '@/features/reports/lifecycle';
import type { LifecycleFacts } from '@/features/reports/lifecycle';
import {
  buildAnalyzeFormData,
  normalizeConfidence,
  resolveAttachmentUrl,
  toUtcTimestamp,
} from '@/features/reports/services/reportService';
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
  WirePriority,
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

/** The expert flow cannot reach Scheduled without a review, even though the schedule endpoint's
 * missing status guard would let the server get there. */
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

/**
 * `factsFromWireStatus` is shared with the farmer and stays conservative - it reads
 * `hasExpertReview` off the `Reviewed` status alone. The expert knows more: a case the server
 * has moved past `Reviewed` was reviewed, and a detail call that returned `expertReviews` says
 * so outright.
 */
export function expertFacts(status: ReportStatus, reviewCount: number): LifecycleFacts {
  if (!WIRE_STATUS_VALUES.has(status)) {
    warnUnknownStatus(status);
  }

  return {
    ...factsFromWireStatus(status),
    hasExpertReview: reviewCount > 0 || REVIEWED_OR_LATER.has(status),
  };
}

/** What IssueService stores when the model names no severity; GetPriority reads it as Unknown. */
const UNKNOWN_SEVERITY: Severity = 'غير معروفة';

// BACKEND-GAP G6: the inbox row carries a priority but no AI severity, so a row whose detail
// call failed falls back to the coarser of the two rather than showing nothing.
const SEVERITY_FOR_PRIORITY: Record<WirePriority, Severity> = {
  Critical: 'حرجة',
  High: 'عالية',
  Medium: 'متوسطة',
  Low: 'منخفضة',
};

export function severityFromPriority(priority: string): Severity {
  return SEVERITY_FOR_PRIORITY[priority as WirePriority] ?? UNKNOWN_SEVERITY;
}

const PHOTO_ATTACHMENT = new Set<IssueAttachmentWire['type']>([0, 'Photo']);

/** The farmer's own photo. First, not last: the repair proof is appended at resolution time and
 * attachments carry no `purpose` to tell the two apart - BACKEND-GAP G4. */
function problemPhotoUrl(attachments: IssueAttachmentWire[]): string | undefined {
  const photo = attachments.find(attachment => PHOTO_ATTACHMENT.has(attachment.type));
  return photo ? resolveAttachmentUrl(photo.url) : undefined;
}

// BACKEND-GAP G3: SubmitExpertReviewRequest is (Decision, Notes) only - there is no field for
// the corrected severity and none for the corrected diagnosis - so both ride inside `notes` in
// the format below. `parseReviewNotes` is the other half; delete them together.
const OVERRIDE_PREFIX = '[تصحيح]';
const OVERRIDE_SEPARATOR = '|';

/** `[تصحيح] <correctedDiagnosis> | <severity>` then the note, either line optional. */
export function composeReviewNotes(fields: SubmitExpertReviewFields): string | null {
  const lines: string[] = [];

  if (fields.override) {
    const { correctedDiagnosis, severity } = fields.override;
    lines.push(`${OVERRIDE_PREFIX} ${correctedDiagnosis} ${OVERRIDE_SEPARATOR} ${severity}`);
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

  // Last separator, not first: the corrected diagnosis is free text and may contain a pipe,
  // while none of the ten SeverityLevel values does.
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

/**
 * Newest last. `currentOverride` is this cycle's decision, which E-03's `قرار الخبير` card reads
 * back. `previousReview` is the cycle before the last reopen and cannot occur yet: a second
 * review is refused unless the status is `Assigned`, and nothing reopens a case - BACKEND-GAP G2.
 */
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
    latest && isOverride(latest)
      ? parseReviewNotes(latest.notes).override
      : undefined;

  const before =
    prior && isOverride(prior) ? parseReviewNotes(prior.notes) : undefined;

  return {
    currentOverride: current,
    previousReview: before?.override
      ? { ...before.override, expertNote: before.expertNote }
      : undefined,
  };
}

// BACKEND-GAP G7: no endpoint resolves a user by id, so the card names no one rather than
// inventing a farmer, and carries no avatar.
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
    // A missing analysis reads as the amber low-confidence chip, which tells the expert to look
    // for themselves. Failing toward "trust this less" is the safe direction.
    confidence: analysis ? normalizeConfidence(analysis.confidence) : 0,
    photoUrl: detail ? problemPhotoUrl(detail.attachments) : undefined,
    reporterName: REPORTER_PLACEHOLDER,
    // BACKEND-GAP G5: no corroboration count exists on any endpoint.
    corroborationCount: 0,
  };
}

/** E-02's detail. Built on `toCaseSummary` so the card and the screen can never disagree -
 * CaseReviewWire carries every field the inbox row does. */
export function toCaseDetail(wire: CaseReviewWire): ExpertCaseDetail {
  const analysis = wire.aiAnalysis;

  return {
    ...toCaseSummary(wire, wire),
    explanation: analysis?.explanation ?? undefined,
    recommendation: analysis?.recommendation,
    description: wire.description ?? undefined,
    ...toReviewHistory(wire.expertReviews),
    // BACKEND-GAP G4/G9: CaseReviewResponse carries neither the repair schedule nor the
    // attachment purpose, so `appointment` and `repair` cannot be read back. E-05 and E-06 show
    // what the hook already holds from this session's own writes.
  };
}

/** Every IssueService refusal arrives as this, because nothing maps the exception to a status. */
const REFUSAL_STATUS = 500;

/** ApiError, 500, and the exception text in the body. Both halves required, so a bare 500 is
 * still read as the outage it probably is. */
export function isServerRefusal(error: unknown, phrase: string): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status === REFUSAL_STATUS &&
    (error.details.serverMessage ?? '').includes(phrase)
  );
}

/** KeyNotFoundException("No issues were found.") - an empty inbox, not a failure. */
const EMPTY_INBOX_MESSAGE = 'No issues were found';

/** `getAssignedCases` only. On `getCaseDetail` the same exception means an unknown id. */
export function isEmptyResultError(error: unknown): boolean {
  return isServerRefusal(error, EMPTY_INBOX_MESSAGE);
}

/** §8.3's six fixed slots as the TimeOnly pair ScheduleRepairRequest wants. Two hours each is
 * an assumption - neither the spec nor the backend states a slot length. See REFERENCE-NOTES. */
export const SLOT_TIMES: Record<ScheduleSlot, { slotStart: string; slotEnd: string }> = {
  '7:00 ص': { slotStart: '07:00:00', slotEnd: '09:00:00' },
  '9:00 ص': { slotStart: '09:00:00', slotEnd: '11:00:00' },
  '11:00 ص': { slotStart: '11:00:00', slotEnd: '13:00:00' },
  '1:00 م': { slotStart: '13:00:00', slotEnd: '15:00:00' },
  '3:00 م': { slotStart: '15:00:00', slotEnd: '17:00:00' },
  '5:00 م': { slotStart: '17:00:00', slotEnd: '19:00:00' },
};

const BASE = API_BASE_URLS.issue;

/** PageSize is clamped server-side to [5, 10], so ten is the most one page can carry. */
const PAGE_SIZE = 10;

/** 1 = date ascending, 2 = date descending. */
const SORT_NEWEST_FIRST = 2;

// The inbox has no server-side status filter, so a long-serving expert's closed cases page
// alongside the live ones. Five pages is the ceiling before the detail fan-out gets expensive.
const MAX_PAGES = 5;
const MAX_ROWS = PAGE_SIZE * MAX_PAGES;

/** Ten detail calls in flight at once: fifty is fine against localhost and not on a device. */
const DETAIL_CHUNK = 10;

function fetchCaseReview(reportId: string): Promise<CaseReviewWire> {
  return apiClient.get<CaseReviewWire>(BASE, API_ENDPOINTS.issue.review(reportId), {
    authenticated: true,
  });
}

/** Pages until the rows reach `totalCount`. Never off `pageCount`, which is the item count on
 * this page rather than the number of pages. */
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
      // On page one this is an empty inbox; on a later page it means the server has no more
      // to give, so either way the rows gathered so far are the answer.
      if (isEmptyResultError(error)) {
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

/**
 * Chunked rather than one wide `Promise.allSettled`. A rejected detail is never fatal and never
 * retried: `toCaseSummary` has a degraded branch for exactly this, which drops the card's
 * confidence to zero so the expert is told to look for themselves.
 */
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
    console.warn(`[expertService] ${failures} of ${ids.length} case details failed to load`);
  }

  return details;
}

/**
 * E-01. One page call per page, then a chunked detail fan-out: the inbox row carries no
 * confidence, no severity string, no reporter and no photo, so the card cannot be filled
 * without the second round trip - BACKEND-GAP G5/G6/G7.
 */
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

/** InvalidOperationException, which a second submission on the same case always hits. */
const REVIEW_REFUSAL = 'Only assigned issues can be reviewed';

/** InvalidOperationException again, from a case that was never scheduled. */
const RESOLUTION_REFUSAL = 'Resolution action can only be created for a scheduled issue';

/** Rebuilt as the 409 the server has no middleware to send. STATUS_MESSAGES[409] tells the
 * expert this may already be done; a 500 would tell them to retry what will fail forever. */
function asConflict(error: ApiError): ApiError {
  return ApiError.fromResponse(CONFLICT_STATUS, error.details);
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
    if (isServerRefusal(error, REVIEW_REFUSAL)) {
      throw asConflict(error);
    }
    throw error;
  }
}

/** T5. No status guard server-side, so a reschedule reaches it - but every call inserts a new
 * RepairSchedule row rather than updating the existing one. See REFERENCE-NOTES.md. */
export async function confirmAppointment(fields: ConfirmAppointmentFields): Promise<void> {
  const body: ScheduleRepairBody = {
    scheduledDate: fields.date,
    ...SLOT_TIMES[fields.slot],
    farmerNotified: true,
    notes: fields.noteToFarmer ?? null,
  };

  await apiClient.post<unknown>(BASE, API_ENDPOINTS.issue.schedule(fields.reportId), body, {
    authenticated: true,
  });
}

/** T6. multipart/form-data, parts named `Photo` and `Notes`. Refused unless the status is
 * exactly `Scheduled`. */
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
    if (isServerRefusal(error, RESOLUTION_REFUSAL)) {
      throw asConflict(error);
    }
    throw error;
  }
}
