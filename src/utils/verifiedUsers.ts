/**
 * Verified Users Configuration
 * List of usernames that receive automatic verified badge status (blue badge)
 * All admin accounts created get blue verified badges
 */

export const VERIFIED_USERNAMES = [
  'wain2020',
  'wainfoundation',
  'droplink',
  'droppay',
  'dropstore',
  'flappypi',
  'flappypiofficial',
  'flappypi_fun',
  'dropshare',
  'openapp',
] as const;

/**
 * VIP Team Members - these users get gold verified badges
 * These are special VIP accounts that show gold instead of blue
 */
export const VIP_TEAM_MEMBERS = [
  'wain2020',
  'wainfoundation',
  'flappypiofficial',
] as const;

/**
 * Check if a username should have verified badge
 * @param username - The username to check (case-insensitive)
 * @returns boolean indicating if user should be verified
 */
export const isVerifiedUser = (username?: string | null): boolean => {
  if (!username) return false;
  const normalizedUsername = username.toLowerCase().trim();
  return VERIFIED_USERNAMES.includes(normalizedUsername as any);
};

/**
 * Check if a username is a VIP team member
 * @param username - The username to check (case-insensitive)
 * @returns boolean indicating if user is VIP
 */
export const isVipUser = (username?: string | null): boolean => {
  if (!username) return false;
  const normalizedUsername = username.toLowerCase().trim();
  return VIP_TEAM_MEMBERS.includes(normalizedUsername as any);
};

/**
 * Get the appropriate verified badge URL based on user status
 * @param username - The username to check
 * @returns URL of the verified badge (gold for VIP, blue for regular)
 */
export const getVerifiedBadgeUrl = (username?: string | null): string => {
  if (isVipUser(username)) {
    return "https://i.ibb.co/Kcz0w18P/verify-6.png"; // Gold badge for VIP
  }
  return "https://i.ibb.co/hRhk04wC/verified-1.png"; // Blue badge for regular verified users
};
