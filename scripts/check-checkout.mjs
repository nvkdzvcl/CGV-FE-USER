import assert from 'node:assert/strict';
import { clearCheckout, getCheckout, getCheckoutAccessIssue, getCheckoutByBookingId, isReleasedBookingStatus, saveCheckout } from '../src/services/checkout.js';

const entries = new Map();
globalThis.sessionStorage = {
  getItem: key => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, value),
  removeItem: key => entries.delete(key)
};

saveCheckout({ showtimeId: 'a', bookingId: 'order-a', ownerUserId: 'account-a' });
saveCheckout({ showtimeId: 'b', bookingId: 'order-b', ownerUserId: 'account-b' });
assert.equal(getCheckout('a').bookingId, 'order-a');
assert.equal(getCheckoutByBookingId('order-b').showtimeId, 'b');
assert.equal(getCheckoutAccessIssue(getCheckout('a'), null), 'login');
assert.equal(getCheckoutAccessIssue(getCheckout('a'), 'account-b'), 'account');
assert.equal(getCheckoutAccessIssue(getCheckout('a'), 'account-a'), null);
assert.equal(getCheckoutAccessIssue({ bookingId: 'old-order', guest: true }, 'account-a'), 'legacy');
clearCheckout('order-a');
assert.equal(getCheckout('a'), null);
assert.equal(getCheckout('b').bookingId, 'order-b');
assert.equal(isReleasedBookingStatus('CANCELLED'), true);
assert.equal(isReleasedBookingStatus('PAYMENT_PENDING'), false);
console.log('Checkout theo tài khoản: đạt');
