/** Gates the tracker link. Not the local mirror: reportStore is per device, not per account. */
export function isReportOwner(
  signedInUserId: string | undefined,
  reporterId: string | undefined,
): boolean {
  // Fails closed on either side: a feed report carries no reporterId and a failed read no id.
  if (!signedInUserId || !reporterId) {
    return false;
  }

  return signedInUserId === reporterId;
}
