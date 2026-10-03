import type { RefusalCode } from './refusals';
import type { Actor } from './statuses';

/** §10.7's rows. One key per row, including the three that are status moves rather than fields. */
export type WritableField =
  | 'evidence'
  | 'location'
  | 'transcript'
  | 'title'
  | 'aiOutput'
  | 'severity'
  | 'correctedDiagnosis'
  | 'publicComment'
  | 'chatMessage'
  | 'corroboration'
  | 'appointment'
  | 'repairPhotoAndNotes'
  | 'statusResolved'
  | 'statusReopened'
  | 'statusAdminClosed'
  | 'assignedExpert';

/** §10.7's cell values. Kept distinct because override and remove are not plain writes. */
export type WritePermission =
  | 'none'
  | 'create'
  | 'write'
  | 'override'
  | 'remove'
  | 'moderate'
  | 'set'
  | 'reassign';

/** §10.7, with its first row split by §3.1's owners. An absent actor means that cell was a dash. */
// §10.7 groups five fields under one "create" cell for brevity; §3.1 gives each its own owner,
// and only evidence is the farmer's. Splitting them is what stops canWrite('title', 'farmer').
const MATRIX: Record<WritableField, Partial<Record<Actor, WritePermission>>> = {
  evidence: { farmer: 'create' },
  location: { system: 'create' },
  transcript: { system: 'create' },
  title: { system: 'create' },
  aiOutput: { system: 'create' },
  severity: { expert: 'override', system: 'create' },
  correctedDiagnosis: { expert: 'write' },
  // The expert's is auto-posted at T4; the AI removes and the Admin confirms or restores.
  publicComment: { farmer: 'write', expert: 'write', system: 'remove', admin: 'moderate' },
  chatMessage: { farmer: 'write', expert: 'write', system: 'write' },
  // Others' reports only, and undoable: canCorroborate() holds that half.
  corroboration: { farmer: 'write' },
  appointment: { expert: 'set' },
  repairPhotoAndNotes: { expert: 'write' },
  statusResolved: { farmer: 'write' },
  statusReopened: { farmer: 'write' },
  statusAdminClosed: { admin: 'write' },
  assignedExpert: { system: 'set', admin: 'reassign' },
};

export function writePermission(field: WritableField, actor: Actor): WritePermission {
  return MATRIX[field][actor] ?? 'none';
}

export function canWrite(field: WritableField, actor: Actor): boolean {
  return writePermission(field, actor) !== 'none';
}

export type WriteResult =
  | { ok: true; permission: WritePermission }
  | { ok: false; refusal: RefusalCode };

/** §3.6's field clauses get their own codes; everything else refused by the matrix is R-WRONG-ACTOR. */
function namedRefusal(field: WritableField, actor: Actor): RefusalCode {
  if (actor === 'farmer') {
    if (field === 'severity') {
      return 'R-FARMER-CANNOT-SET-SEVERITY';
    }
    if (field === 'appointment') {
      return 'R-FARMER-CANNOT-SET-APPOINTMENT';
    }
    if (field === 'assignedExpert') {
      return 'R-FARMER-CANNOT-SET-EXPERT';
    }
  }

  if (field === 'statusResolved' && actor === 'expert') {
    return 'R-EXPERT-CANNOT-CLOSE';
  }

  // §3.6: nothing on mobile produces مغلقة إدارياً, so even the Admin cell is unreachable here.
  if (field === 'statusAdminClosed') {
    return 'R-NO-MOBILE-ADMIN-CLOSE';
  }

  return 'R-WRONG-ACTOR';
}

/** Ask before writing a field, and get §3.6's reason rather than a bare false when refused. */
export function requestWrite(field: WritableField, actor: Actor): WriteResult {
  if (field === 'statusAdminClosed') {
    return { ok: false, refusal: 'R-NO-MOBILE-ADMIN-CLOSE' };
  }

  const permission = writePermission(field, actor);
  if (permission === 'none') {
    return { ok: false, refusal: namedRefusal(field, actor) };
  }

  return { ok: true, permission };
}
