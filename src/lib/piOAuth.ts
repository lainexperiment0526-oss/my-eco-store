// Pi Network OAuth (implicit flow) configuration.
// The client_id is issued in the Pi Developer Portal.
// Redirect URI must be registered there exactly.
export const PI_OAUTH_CLIENT_ID = '9Nln8T-RnQM_nl1RzJfuv45shfnVtMb9glRnUJen9yQ';
export const PI_OAUTH_REDIRECT_URI = 'https://openappdev.space/auth/pi/callback';

// Pi OAuth authorization endpoint (implicit flow — returns access_token in URL fragment).
export const PI_OAUTH_AUTHORIZE_URL = 'https://api.minepi.com/oauth/v1/authorize';

export function buildPiOAuthUrl(state?: string) {
  const params = new URLSearchParams({
    response_type: 'token',
    client_id: PI_OAUTH_CLIENT_ID,
    redirect_uri: PI_OAUTH_REDIRECT_URI,
    scope: 'username',
  });
  if (state) params.set('state', state);
  return `${PI_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}
