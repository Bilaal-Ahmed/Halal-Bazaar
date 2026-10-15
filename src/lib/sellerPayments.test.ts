import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allocateSellerTaxCents,
  applySellerPaymentReview,
  assertSellerPaymentEntriesMatchSellers,
  createPendingSellerPayment,
  findEnabledPaymentAccount,
  isApprovedSellerProfile,
  PaymentValidationError,
  validateSellerPaymentAccounts,
  validateSellerPaymentEntries,
  validateTransferReference,
} from './sellerPayments.ts';

const account = {
  id: 'account-1',
  method: 'raast' as const,
  accountTitle: 'Seller Name',
  accountNumber: '03001234567',
  iban: '',
  instructions: '',
  enabled: true,
};

test('validates payment account IDs and rejects duplicate IDs', () => {
  assert.equal(validateSellerPaymentAccounts([account])[0].id, account.id);
  assert.throws(
    () => validateSellerPaymentAccounts([account, account]),
    (error: unknown) => error instanceof PaymentValidationError
      && error.code === 'duplicate_payment_account',
  );
});

test('rejects unsupported methods and account lists over the limit', () => {
  assert.throws(
    () => validateSellerPaymentAccounts([{ ...account, method: 'crypto' }]),
    (error: unknown) => error instanceof PaymentValidationError
      && error.code === 'invalid_payment_method',
  );
  assert.throws(
    () => validateSellerPaymentAccounts(Array.from({ length: 11 }, (_, index) => ({
      ...account,
      id: `account-${index}`,
    }))),
    (error: unknown) => error instanceof PaymentValidationError
      && error.code === 'invalid_payment_accounts',
  );
});

test('disabled payment accounts are never selectable', () => {
  const accounts = validateSellerPaymentAccounts([{ ...account, enabled: false }]);
  assert.equal(findEnabledPaymentAccount(accounts, account.id), undefined);
});

test('an account ID from another seller is not found in this seller saved configuration', () => {
  const sellerAAccounts = validateSellerPaymentAccounts([account]);
  assert.equal(findEnabledPaymentAccount(sellerAAccounts, 'sellerB-account'), undefined);
});

test('validates and trims transfer references without accepting control characters', () => {
  assert.equal(validateTransferReference('  TXN-123 / 4  '), 'TXN-123 / 4');
  assert.throws(() => validateTransferReference('TXN\n123'), PaymentValidationError);
});

test('rejects duplicate seller entries and requires entries for exactly the actual sellers', () => {
  const first = { sellerId: 'sellerA', paymentAccountId: 'account-1', transferReference: 'TXN-1' };
  const second = { sellerId: 'sellerB', paymentAccountId: 'account-2', transferReference: 'TXN-2' };
  assert.throws(
    () => validateSellerPaymentEntries([first, first]),
    (error: unknown) => error instanceof PaymentValidationError
      && error.code === 'duplicate_seller_payment',
  );
  const entries = validateSellerPaymentEntries([first, second]);
  assert.equal('status' in entries[0], false);
  assert.throws(
    () => validateSellerPaymentEntries([{ ...first, status: 'paid' }]),
    (error: unknown) => error instanceof PaymentValidationError
      && error.code === 'invalid_seller_payment',
  );
  assert.doesNotThrow(() => assertSellerPaymentEntriesMatchSellers(entries, ['sellerA', 'sellerB']));
  assert.throws(
    () => assertSellerPaymentEntriesMatchSellers(entries.slice(0, 1), ['sellerA', 'sellerB']),
    (error: unknown) => error instanceof PaymentValidationError
      && error.code === 'seller_payment_mismatch',
  );
  assert.throws(
    () => assertSellerPaymentEntriesMatchSellers(entries, ['sellerA', 'sellerC']),
    (error: unknown) => error instanceof PaymentValidationError
      && error.code === 'seller_payment_mismatch',
  );
});

test('buyer transfer references create pending seller payments, never paid payments', () => {
  const selection = validateSellerPaymentEntries([{
    sellerId: 'sellerA',
    paymentAccountId: account.id,
    transferReference: 'TXN-42',
  }])[0];
  const payment = createPendingSellerPayment(selection, account, 1200, 60);
  assert.equal(payment.status, 'pending_review');
  assert.equal(payment.subtotal, 12);
  assert.equal(payment.taxAmount, 0.6);
  assert.equal(payment.amount, 12.6);
  assert.equal(payment.reviewedAt, null);
  assert.equal(payment.reviewedBy, null);
});

test('only approved seller profiles pass seller authorization', () => {
  assert.equal(isApprovedSellerProfile({ role: 'seller', status: 'approved' }), true);
  assert.equal(isApprovedSellerProfile({ role: 'seller', status: 'pending' }), false);
  assert.equal(isApprovedSellerProfile({ role: 'buyer', status: 'approved' }), false);
});

test('seller reviews change only their own payment and pay the order only when all sellers approve', () => {
  const original = {
    sellerA: { sellerId: 'sellerA', status: 'pending_review' },
    sellerB: { sellerId: 'sellerB', status: 'pending_review' },
  };
  const firstReview = applySellerPaymentReview(original, 'sellerA', 'approve', 'sellerA', 'now');
  assert.equal(firstReview.sellerPayments.sellerA.status, 'paid');
  assert.equal(firstReview.sellerPayments.sellerB.status, 'pending_review');
  assert.equal(firstReview.paymentStatus, 'pending_review');
  assert.equal(original.sellerA.status, 'pending_review');
  assert.throws(
    () => applySellerPaymentReview(original, 'sellerC', 'approve', 'sellerC', 'now'),
    (error: unknown) => error instanceof PaymentValidationError
      && error.code === 'seller_payment_not_found',
  );

  const finalReview = applySellerPaymentReview(
    firstReview.sellerPayments,
    'sellerB',
    'approve',
    'sellerB',
    'later',
  );
  assert.equal(finalReview.paymentStatus, 'paid');
});

test('rejected or previously reviewed seller payments cannot be marked paid', () => {
  const original = {
    sellerA: { sellerId: 'sellerA', status: 'pending_review' },
    sellerB: { sellerId: 'sellerB', status: 'pending_review' },
  };
  const rejected = applySellerPaymentReview(original, 'sellerA', 'reject', 'sellerA', 'now');
  assert.equal(rejected.paymentStatus, 'rejected');
  assert.equal(rejected.sellerPayments.sellerB.status, 'pending_review');
  assert.throws(
    () => applySellerPaymentReview(rejected.sellerPayments, 'sellerA', 'approve', 'sellerA', 'later'),
    (error: unknown) => error instanceof PaymentValidationError
      && error.code === 'seller_payment_already_reviewed',
  );
});

test('allocates tax in cents deterministically and preserves the total exactly', () => {
  const subtotals = { sellerB: 1, sellerA: 1, sellerC: 1 };
  const first = allocateSellerTaxCents(subtotals, 2);
  const second = allocateSellerTaxCents(subtotals, 2);
  assert.deepEqual(first, { sellerA: 1, sellerB: 1, sellerC: 0 });
  assert.deepEqual(second, first);
  assert.equal(Object.values(first).reduce((total, amount) => total + amount, 0), 2);
});
