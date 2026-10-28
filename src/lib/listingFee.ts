/** Display and workflow fee; admin status must come from protected server roles. */
export function listingFeePi(isAdmin: boolean): number {
  return isAdmin ? 0 : 25;
}