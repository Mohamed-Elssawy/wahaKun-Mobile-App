const REFERENCE_LENGTH = 4;

/** The head, not the tail: EF's sequential GUIDs share a tail across a whole process. */
export function formatReportReference(id: string): string {
  return `#${id.slice(0, REFERENCE_LENGTH).toUpperCase()}`;
}
