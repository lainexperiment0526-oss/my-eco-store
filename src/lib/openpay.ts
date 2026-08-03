export const OPENPAY_CLIENT_ID = '526ebb5e-a269-45c4-b247-3dc204564b94';
export const OPENPAY_AUTHORIZE_URL = 'https://openpy.space/connect';
export const OPENPAY_SITE_URL = 'https://openpy.space';
export const OPENPAY_PARTNER_PORTAL_URL = 'https://openpy.space/partner-api';
export const OPENPAY_LOGO_URL = 'https://openpy.space/openpay-auth-logo.png';
export const OPENPAY_REDIRECT_URI = 'https://www.openappdev.space/auth/openpay/callback';

export const OPENPAY_SCOPES = ['profile', 'balance'] as const;

export function buildOpenPayConnectUrl(state?: string, scope: string = OPENPAY_SCOPES.join(' ')) {
  const url = new URL(OPENPAY_AUTHORIZE_URL);
  url.searchParams.set('client_id', OPENPAY_CLIENT_ID);
  url.searchParams.set('redirect_uri', OPENPAY_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  if (state) url.searchParams.set('state', state);
  return url.toString();
}

export function startOpenPayConnect(scope?: string) {
  const state = crypto.randomUUID();
  sessionStorage.setItem('openpay_oauth_state', state);
  window.location.href = buildOpenPayConnectUrl(state, scope);
}
