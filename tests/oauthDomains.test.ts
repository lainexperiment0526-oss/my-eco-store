import { describe, expect, test } from 'bun:test';
import { buildPiOAuthUrl } from '../src/lib/piOAuth';
import { buildOpenPayConnectUrl } from '../src/lib/openpay';

describe('official authentication callback domain', () => {
  test('Pi returns to open-app.store', () => {
    const url = new URL(buildPiOAuthUrl('test-state'));
    expect(url.searchParams.get('redirect_uri')).toBe('https://open-app.store/auth/pi/callback');
  });

  test('OpenPay returns to open-app.store', () => {
    const url = new URL(buildOpenPayConnectUrl('test-state'));
    expect(url.searchParams.get('redirect_uri')).toBe('https://open-app.store/auth/openpay/callback');
  });
});