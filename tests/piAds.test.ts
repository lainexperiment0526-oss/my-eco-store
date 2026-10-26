import { describe, expect, test } from 'bun:test';
import { createPiAdPlayer, isPiBrowser, withPiTimeout, type PiAdSdk } from '../src/lib/piAds';

function fixture({ supported = true, ready = true, loaded = 'AD_LOADED', shown = 'AD_CLOSED' } = {}) {
  const calls: string[] = [];
  const sdk: PiAdSdk = {
    nativeFeaturesList: async () => { calls.push('features'); return supported ? ['ad_network'] : []; },
    Ads: {
      isAdReady: async () => { calls.push('ready'); return { ready }; },
      requestAd: async () => { calls.push('request'); return { result: loaded }; },
      showAd: async () => { calls.push('show'); return { result: shown }; },
    },
  };
  return { sdk, calls };
}

describe('Pi Browser ad rules', () => {
  test('identifies Pi Browser consistently across triggers', () => {
    expect(isPiBrowser('Mozilla/5.0 PiBrowser/1.0')).toBe(true);
    expect(isPiBrowser('Mozilla/5.0 minepi')).toBe(true);
    expect(isPiBrowser('Mozilla/5.0 Chrome/130 Safari/537.36')).toBe(false);
  });

  test('ordinary browsers never initialize or request native ads', async () => {
    let sdkLoads = 0;
    const player = createPiAdPlayer(async () => { sdkLoads++; return fixture().sdk; }, () => false);
    expect(await player('interstitial')).toBe(false);
    expect(sdkLoads).toBe(0);
  });

  test('Pi Browser without ad_network never requests or shows ads', async () => {
    const { sdk, calls } = fixture({ supported: false });
    expect(await createPiAdPlayer(async () => sdk, () => true)('interstitial')).toBe(false);
    expect(calls).toEqual(['features']);
  });

  test('ready ads show without another request', async () => {
    const { sdk, calls } = fixture();
    expect(await createPiAdPlayer(async () => sdk, () => true)('interstitial')).toBe(true);
    expect(calls).toEqual(['features', 'ready', 'show']);
  });

  test('unready ads load before showing', async () => {
    const { sdk, calls } = fixture({ ready: false });
    expect(await createPiAdPlayer(async () => sdk, () => true)('interstitial')).toBe(true);
    expect(calls).toEqual(['features', 'ready', 'request', 'show']);
  });

  test('unavailable ads allow the caller to fall back to OpenApp ads', async () => {
    const { sdk, calls } = fixture({ ready: false, loaded: 'AD_NOT_AVAILABLE' });
    expect(await createPiAdPlayer(async () => sdk, () => true)('interstitial')).toBe(false);
    expect(calls).toEqual(['features', 'ready', 'request']);
  });

  test('overlapping triggers share one visible ad and wait for closure', async () => {
    const { sdk, calls } = fixture();
    let close: ((value: { result: string }) => void) | undefined;
    sdk.Ads.showAd = () => { calls.push('show'); return new Promise((resolve) => { close = resolve; }); };
    const player = createPiAdPlayer(async () => sdk, () => true);
    const first = player('interstitial');
    const second = player('interstitial');
    expect(first).toBe(second);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(calls.filter((call) => call === 'show')).toHaveLength(1);
    if (!close) throw new Error('Ad was not shown');
    close({ result: 'AD_CLOSED' });
    expect(await first).toBe(true);
    sdk.Ads.showAd = async () => ({ result: 'AD_CLOSED' });
    expect(await player('interstitial')).toBe(true);
  });

  test('SDK errors and failed initialization are nonblocking', async () => {
    expect(await createPiAdPlayer(async () => null, () => true)('interstitial')).toBe(false);
    expect(await createPiAdPlayer(async () => { throw new Error('init failed'); }, () => true)('interstitial')).toBe(false);
  });

  test('stalled readiness requests time out rather than trapping navigation', async () => {
    await expect(withPiTimeout(new Promise(() => {}), 5)).rejects.toThrow('Pi SDK request timed out');
  });
});