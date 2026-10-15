export const SELLER_PAYMENT_METHODS = [
  'jazzcash',
  'easypaisa',
  'raast',
  'bank_transfer',
] as const;

export type SellerPaymentMethod = (typeof SELLER_PAYMENT_METHODS)[number];

export interface SellerPaymentAccount {
  id: string;
  method: SellerPaymentMethod;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  instructions: string;
  enabled: boolean;
}

export interface SellerPaymentSelection {
  sellerId: string;
  paymentAccountId: string;
  transferReference: string;
}

export interface SellerPaymentRecord {
  sellerId: string;
  subtotal: number;
  taxAmount: number;
  amount: number;
  paymentAccountId: string;
  paymentAccount: SellerPaymentAccount;
  transferReference: string;
  status: 'pending_review' | 'paid' | 'rejected';
  reviewedAt: unknown;
  reviewedBy: string | null;
}

export class PaymentValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PaymentValidationError';
  }
}

export function isApprovedSellerProfile(
  profile: { role?: unknown; status?: unknown } | null | undefined,
): boolean {
  return profile?.role === 'seller' && profile.status === 'approved';
}

function requiredText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.trim().length <= maxLength;
}

function optionalText(value: unknown, maxLength: number): value is string {
  return value === undefined
    || (typeof value === 'string' && value.trim().length <= maxLength);
}

export function validateSellerPaymentAccounts(value: unknown): SellerPaymentAccount[] {
  if (!Array.isArray(value) || value.length > 10) {
    throw new PaymentValidationError(
      'invalid_payment_accounts',
      'Provide up to 10 payment accounts.',
    );
  }

  const ids = new Set<string>();

  return value.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new PaymentValidationError(
        'invalid_payment_account',
        'Invalid payment account.',
      );
    }

    const account = entry as Record<string, unknown>;
    const allowedFields = new Set([
      'id',
      'method',
      'accountTitle',
      'accountNumber',
      'iban',
      'instructions',
      'enabled',
      'updatedAt',
    ]);
    if (Object.keys(account).some((key) => !allowedFields.has(key))) {
      throw new PaymentValidationError(
        'invalid_payment_account',
        'Payment accounts contain unsupported fields.',
      );
    }

    if (!requiredText(account.id, 80) || !/^[A-Za-z0-9_-]+$/.test(account.id.trim())) {
      throw new PaymentValidationError(
        'invalid_payment_account',
        'Each payment account requires a valid account ID.',
      );
    }

    const id = account.id.trim();
    if (ids.has(id)) {
      throw new PaymentValidationError(
        'duplicate_payment_account',
        'Account IDs must be unique.',
      );
    }
    ids.add(id);

    if (
      typeof account.method !== 'string'
      || !SELLER_PAYMENT_METHODS.includes(account.method as SellerPaymentMethod)
    ) {
      throw new PaymentValidationError(
        'invalid_payment_method',
        'Choose a supported payment method.',
      );
    }

    if (
      !requiredText(account.accountTitle, 100)
      || !requiredText(account.accountNumber, 100)
      || !optionalText(account.iban, 50)
      || !optionalText(account.instructions, 500)
      || !optionalText(account.updatedAt, 64)
      || typeof account.enabled !== 'boolean'
    ) {
      throw new PaymentValidationError(
        'invalid_payment_account',
        'Check the payment account fields.',
      );
    }

    return {
      id,
      method: account.method as SellerPaymentMethod,
      accountTitle: account.accountTitle.trim(),
      accountNumber: account.accountNumber.trim(),
      iban: typeof account.iban === 'string' ? account.iban.trim() : '',
      instructions: typeof account.instructions === 'string'
        ? account.instructions.trim()
        : '',
      enabled: account.enabled,
    };
  });
}

export function findEnabledPaymentAccount(
  accounts: readonly SellerPaymentAccount[],
  accountId: string,
): SellerPaymentAccount | undefined {
  return accounts.find((account) => account.id === accountId && account.enabled);
}

export function validateTransferReference(value: unknown): string {
  if (
    typeof value !== 'string'
    || value.trim().length < 1
    || value.trim().length > 120
    || !/^[A-Za-z0-9][A-Za-z0-9 ._/#:-]*$/.test(value.trim())
  ) {
    throw new PaymentValidationError(
      'invalid_transfer_reference',
      'Enter a valid transfer reference of up to 120 characters.',
    );
  }
  return value.trim();
}

export function validateSellerPaymentEntries(value: unknown): SellerPaymentSelection[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    throw new PaymentValidationError(
      'invalid_seller_payments',
      'Provide one payment entry for each seller.',
    );
  }

  const sellerIds = new Set<string>();
  return value.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new PaymentValidationError('invalid_seller_payment', 'Invalid seller payment entry.');
    }

    const payment = entry as Record<string, unknown>;
    if (Object.keys(payment).some((key) => ![
      'sellerId',
      'paymentAccountId',
      'transferReference',
    ].includes(key))) {
      throw new PaymentValidationError(
        'invalid_seller_payment',
        'Seller payment entries contain unsupported fields.',
      );
    }
    if (
      typeof payment.sellerId !== 'string'
      || !/^[A-Za-z0-9_-]{1,128}$/.test(payment.sellerId)
      || typeof payment.paymentAccountId !== 'string'
      || !/^[A-Za-z0-9_-]{1,80}$/.test(payment.paymentAccountId)
    ) {
      throw new PaymentValidationError(
        'invalid_seller_payment',
        'Each seller payment requires a valid seller and account ID.',
      );
    }
    if (sellerIds.has(payment.sellerId)) {
      throw new PaymentValidationError(
        'duplicate_seller_payment',
        'Provide only one payment entry per seller.',
      );
    }
    sellerIds.add(payment.sellerId);

    return {
      sellerId: payment.sellerId,
      paymentAccountId: payment.paymentAccountId,
      transferReference: validateTransferReference(payment.transferReference),
    };
  });
}

export function assertSellerPaymentEntriesMatchSellers(
  entries: readonly SellerPaymentSelection[],
  sellerIds: readonly string[],
): void {
  if (
    entries.length !== sellerIds.length
    || entries.some((entry) => !sellerIds.includes(entry.sellerId))
  ) {
    throw new PaymentValidationError(
      'seller_payment_mismatch',
      'Provide exactly one payment entry for each seller in the order.',
    );
  }
}

export function createPendingSellerPayment(
  selection: SellerPaymentSelection,
  account: SellerPaymentAccount,
  subtotalCents: number,
  taxCents: number,
): SellerPaymentRecord {
  if (
    !Number.isSafeInteger(subtotalCents)
    || subtotalCents <= 0
    || !Number.isSafeInteger(taxCents)
    || taxCents < 0
    || taxCents > subtotalCents
    || !Number.isSafeInteger(subtotalCents + taxCents)
  ) {
    throw new RangeError('Seller payment amounts must be non-negative safe integer cents.');
  }
  return {
    sellerId: selection.sellerId,
    subtotal: subtotalCents / 100,
    taxAmount: taxCents / 100,
    amount: (subtotalCents + taxCents) / 100,
    paymentAccountId: selection.paymentAccountId,
    paymentAccount: account,
    transferReference: selection.transferReference,
    status: 'pending_review',
    reviewedAt: null,
    reviewedBy: null,
  };
}

export function applySellerPaymentReview(
  sellerPayments: Record<string, Record<string, unknown>>,
  sellerId: string,
  decision: 'approve' | 'reject',
  reviewerId: string,
  reviewedAt: unknown,
): { sellerPayments: Record<string, Record<string, unknown>>; paymentStatus: 'pending_review' | 'paid' | 'rejected' } {
  const ownPayment = sellerPayments[sellerId];
  if (!ownPayment || ownPayment.sellerId !== sellerId) {
    throw new PaymentValidationError(
      'seller_payment_not_found',
      'Your seller payment record is unavailable.',
    );
  }
  if (ownPayment.status !== 'pending_review') {
    throw new PaymentValidationError(
      'seller_payment_already_reviewed',
      'This seller payment has already been reviewed.',
    );
  }

  const updatedSellerPayments = {
    ...sellerPayments,
    [sellerId]: {
      ...ownPayment,
      status: decision === 'approve' ? 'paid' : 'rejected',
      reviewedAt,
      reviewedBy: reviewerId,
    },
  };
  const statuses = Object.values(updatedSellerPayments).map((payment) => {
    if (!payment || typeof payment !== 'object' || Array.isArray(payment)) {
      throw new PaymentValidationError(
        'seller_payment_state_invalid',
        'Seller payment records contain an invalid state.',
      );
    }
    return payment.status;
  });
  if (statuses.length === 0 || statuses.some((status) => (
    status !== 'pending_review' && status !== 'paid' && status !== 'rejected'
  ))) {
    throw new PaymentValidationError(
      'seller_payment_state_invalid',
      'Seller payment records contain an invalid state.',
    );
  }
  const paymentStatus = statuses.some((status) => status === 'rejected')
    ? 'rejected'
    : statuses.every((status) => status === 'paid')
      ? 'paid'
      : 'pending_review';

  return { sellerPayments: updatedSellerPayments, paymentStatus };
}

export function allocateSellerTaxCents(
  sellerSubtotals: Readonly<Record<string, number>>,
  taxCents: number,
): Record<string, number> {
  const sellerIds = Object.keys(sellerSubtotals).sort();
  const subtotalCents = sellerIds.reduce((total, sellerId) => {
    const value = sellerSubtotals[sellerId];
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new RangeError('Seller subtotals must be positive safe integer cents.');
    }
    return total + value;
  }, 0);

  if (
    sellerIds.length === 0
    || !Number.isSafeInteger(subtotalCents)
    || !Number.isSafeInteger(taxCents)
    || taxCents < 0
    || taxCents > subtotalCents
  ) {
    throw new RangeError('Tax and seller subtotals are outside the supported range.');
  }

  const total = BigInt(subtotalCents);
  const tax = BigInt(taxCents);
  const allocations = new Map<string, { cents: number; remainder: bigint }>();
  let allocatedCents = 0;

  for (const sellerId of sellerIds) {
    const product = BigInt(sellerSubtotals[sellerId]) * tax;
    const cents = Number(product / total);
    allocations.set(sellerId, { cents, remainder: product % total });
    allocatedCents += cents;
  }

  const remainderOrder = [...allocations.entries()].sort(([leftId, left], [rightId, right]) => {
    if (left.remainder !== right.remainder) {
      return left.remainder > right.remainder ? -1 : 1;
    }
    return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
  });

  for (let index = 0; index < taxCents - allocatedCents; index += 1) {
    const [sellerId, allocation] = remainderOrder[index];
    allocations.set(sellerId, { ...allocation, cents: allocation.cents + 1 });
  }

  return Object.fromEntries(
    sellerIds.map((sellerId) => [sellerId, allocations.get(sellerId)!.cents]),
  );
}
