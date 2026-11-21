/** A hook, not a constant: the real answer needs a request. False until a service exists. */
export function useUnreadChats(): { hasUnread: boolean } {
  return { hasUnread: false };
}
