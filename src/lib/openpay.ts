export const OPENPAY_CLIENT_ID = '526ebb5e-a269-45c4-b247-3dc204564b94';
export const OPENPAY_AUTHORIZE_URL = 'https://openpay.lovable.app/oauth/authorize';
export const OPENPAY_REDIRECT_URI = 'https://www.openappdev.space/openpay/connect/callback';

export const OPENPAY_SCOPES = ['profile', 'balance', 'transfer'] as const;

export function buildOpenPayConnectUrl(state?: string) {
  const params = new URLSearchParams({
    client_id: OPENPAY_CLIENT_ID,
    redirect_uri: OPENPAY_REDIRECT_URI,
    response_type: 'code',
    scope: OPENPAY_SCOPES.join(' '),
  });
  if (state) params.set('state', state);
  return `${OPENPAY_AUTHORIZE_URL}?${params.toString()}`;
}

export function startOpenPayConnect() {
  const state = crypto.randomUUID();
  sessionStorage.setItem('openpay_oauth_state', state);
  window.location.href = buildOpenPayConnectUrl(state);
}
