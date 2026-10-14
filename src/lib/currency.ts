const configuredCurrency = import.meta.env.VITE_ORDER_CURRENCY || 'USD';
const DISPLAY_CURRENCY = /^[A-Za-z]{3}$/.test(configuredCurrency)
  ? configuredCurrency.toUpperCase()
  : 'USD';

export function formatCurrency(amount: number, currency = DISPLAY_CURRENCY) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
