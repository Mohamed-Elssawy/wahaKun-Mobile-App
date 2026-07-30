const REFERENCE_LENGTH = 4;

/** The tail of a GUID, because its leading block repeats across records created together. */
export function formatReportReference(id: string): string {
  return `#${id.slice(-REFERENCE_LENGTH).toUpperCase()}`;
}
