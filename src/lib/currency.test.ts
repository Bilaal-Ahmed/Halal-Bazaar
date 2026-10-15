import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateTaxCents,
  getProductPrice,
  isCashOnDeliveryAllowed,
  marketCurrencyForCountry,
} from './currency';

test('uses only the explicit price for the selected market', () => {
  const product = { pricePKR: 2500, priceUSD: 12 };
  assert.equal(getProductPrice(product, 'PKR'), 2500);
  assert.equal(getProductPrice(product, 'USD'), 12);
});

test('does not convert or infer prices for a market without a price', () => {
  const product = { pricePKR: 2500 };
  assert.equal(getProductPrice(product, 'USD'), null);
  assert.equal(getProductPrice({ price: 2500 }, 'PKR'), null);
});

test('uses a legacy price only when its configured currency matches the market', () => {
  const product = { price: 2500 };
  assert.equal(getProductPrice(product, 'PKR', 'PKR'), 2500);
  assert.equal(getProductPrice(product, 'USD', 'PKR'), null);
  assert.equal(getProductPrice(product, 'PKR', 'USD'), null);
});

test('does not fall back to a legacy value when an explicit market price is invalid', () => {
  assert.equal(getProductPrice({ price: 2500, pricePKR: 0 }, 'PKR', 'PKR'), null);
});

test('selects PKR only for Pakistan and USD for international country codes', () => {
  assert.equal(marketCurrencyForCountry('pk'), 'PKR');
  assert.equal(marketCurrencyForCountry('US'), 'USD');
});

test('allows COD only for configured destinations and calculates tax in cents', () => {
  const allowedCountries = new Set(['PK']);
  assert.equal(isCashOnDeliveryAllowed('pk', allowedCountries), true);
  assert.equal(isCashOnDeliveryAllowed('US', allowedCountries), false);
  assert.equal(calculateTaxCents(10001, 0.05), 500);
});
