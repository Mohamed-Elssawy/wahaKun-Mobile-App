/**
 * Whether المحادثات carries its unread dot. PROPOSED: no service answers this yet, so it is
 * false for now and the dot is wired rather than guessed at.
 */
// A hook, not a constant, because the real answer comes from a request and a subscription.
export function useUnreadChats(): { hasUnread: boolean } {
  return { hasUnread: false };
}
