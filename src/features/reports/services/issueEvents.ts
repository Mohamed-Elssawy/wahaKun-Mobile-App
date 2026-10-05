// Module state, not a hook: create happens in the queue's drain, far from any screen that shows issues.

export type IssueChange =
  | { kind: 'created'; issueId: string }
  | { kind: 'deleted'; issueId: string };

type Listener = (change: IssueChange) => void;

const listeners = new Set<Listener>();

/** Fired after api/Issue/create or api/Issue/{id} succeeds, so the map can refetch while open. */
export function emitIssueChange(change: IssueChange): void {
  for (const listener of listeners) {
    listener(change);
  }
}

/** Returns the unsubscribe, so it drops straight into a useEffect cleanup. */
export function subscribeToIssueChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
