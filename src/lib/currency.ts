export type MarketCurrency = 'PKR' | 'USD';

interface ProductPrices {
  price?: number;
  pricePKR?: number;
  priceUSD?: number;
}

export function formatCurrency(amount: number, currency: string) {
  const normalizedCurrency =
    typeof currency === 'string' ? currency.trim().toUpperCase() : '';

  if (normalizedCurrency !== 'PKR' && normalizedCurrency !== 'USD') {
    return `${new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(amount)} (currency unavailable)`;
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: normalizedCurrency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getProductPrice(
  product: ProductPrices,
  currency: MarketCurrency,
  legacyPriceCurrency?: MarketCurrency | null,
): number | null {
  const explicitPrice = currency === 'PKR' ? product.pricePKR : product.priceUSD;
  if (explicitPrice !== undefined) {
    return Number.isFinite(explicitPrice) && explicitPrice > 0
      ? explicitPrice
      : null;
  }

  if (
    legacyPriceCurrency === currency &&
    typeof product.price === 'number' &&
    Number.isFinite(product.price) &&
    product.price > 0
  ) {
    return product.price;
  }

  return null;
}

export function marketCurrencyForCountry(countryCode: string): MarketCurrency {
  return countryCode.trim().toUpperCase() === 'PK' ? 'PKR' : 'USD';
}

export function isCashOnDeliveryAllowed(
  countryCode: string,
  allowedCountries: ReadonlySet<string>,
): boolean {
  return allowedCountries.has(countryCode.trim().toUpperCase());
}

export function calculateTaxCents(subtotalCents: number, taxRate: number): number {
  return Math.round(subtotalCents * taxRate);
}

export function formatProductPrices(
  product: ProductPrices,
  legacyPriceCurrency?: MarketCurrency | null,
): string[] {
  const pricePKR = getProductPrice(product, 'PKR', legacyPriceCurrency);
  const priceUSD = getProductPrice(product, 'USD', legacyPriceCurrency);
  return [
    pricePKR === null ? null : formatCurrency(pricePKR, 'PKR'),
    priceUSD === null ? null : formatCurrency(priceUSD, 'USD'),
  ].filter((price): price is string => price !== null);
}
