// Codes rather than thrown errors: a model that throws cannot be called from a render path, and
// §3.6's clauses are things screens must not offer, not errors a farmer should ever read.

/** §3.6, plus the two generic guard failures a table lookup needs. No Arabic: nothing shows these. */
export type RefusalCode =
  /** §3.6's own code. تم الحل is terminal, so no event moves a closed case. */
  | 'S-TERMINAL'
  /** Only the farmer closes a case, or the Admin force-closes it. */
  | 'R-EXPERT-CANNOT-CLOSE'
  /** The expert cannot return a case to جديدة, decline it, or hand it back. */
  | 'R-EXPERT-CANNOT-HAND-BACK'
  | 'R-FARMER-CANNOT-SET-SEVERITY'
  | 'R-FARMER-CANNOT-SET-APPOINTMENT'
  | 'R-FARMER-CANNOT-SET-EXPERT'
  /** §3.6: nothing on mobile produces مغلقة إدارياً, and there is no Admin on this client. */
  | 'R-NO-MOBILE-ADMIN-CLOSE'
  /** Reassignment is Admin-only, for the same reason. */
  | 'R-NO-MOBILE-ADMIN-REASSIGN'
  /** §3.6: no auto-close, no auto-escalate, no auto-cancel, anywhere. */
  | 'R-NO-TIMEOUT'
  /** The event exists, but not from this status. */
  | 'R-WRONG-STATUS'
  /** The event exists, but not for this actor. */
  | 'R-WRONG-ACTOR';
