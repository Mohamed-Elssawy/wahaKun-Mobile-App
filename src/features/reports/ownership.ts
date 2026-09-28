/**
 * Whether the signed-in farmer filed a report, which is what gates F-04's tracker link into
 * F-06. The tracker carries scheduling and expert detail nobody but the reporter should read.
 */
// Deliberately not "is it in the local mirror": reportStore is keyed per device, not per
// account, so a shared phone - or one a farmer has signed out of - still holds the previous
// account's reports and would answer true for the wrong person.
export function isReportOwner(
  signedInUserId: string | undefined,
  reporterId: string | undefined,
): boolean {
  // Fails closed on either side. A report opened from the feed carries no reporterId, and a
  // UserService call that failed leaves no signed-in id; both hide the link rather than guess.
  if (!signedInUserId || !reporterId) {
    return false;
  }

  return signedInUserId === reporterId;
}
