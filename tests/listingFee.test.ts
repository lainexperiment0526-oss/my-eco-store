import { expect, test } from 'bun:test';
import { listingFeePi } from '../src/lib/listingFee';

test('admins submit listings without paying', () => {
  expect(listingFeePi(true)).toBe(0);
});

test('non-admin listing fee remains 25 Pi', () => {
  expect(listingFeePi(false)).toBe(25);
});