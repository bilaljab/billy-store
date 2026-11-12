// Runnable check: `node --experimental-strip-types src/lib/discounts.check.mjs`
import assert from 'node:assert/strict';
import { getBestDiscount, applyDiscount } from './discounts.ts';

const rule = (o) => ({ id: 1, type: 'range', label: 'r', percentage: 10, active: true, productIds: [], minPrice: null, maxPrice: null, ...o });
const global = { percentage: 5, label: 'g', active: true };
const p = { id: 7, price: 200 };

assert.equal(getBestDiscount(p, [], null), null);
assert.equal(getBestDiscount(p, [], global).percentage, 5);
assert.equal(getBestDiscount(p, [], { ...global, active: false }), null);
// targeted beats global even when lower
assert.equal(getBestDiscount(p, [rule({ percentage: 3 })], global).percentage, 3);
// highest targeted wins
assert.equal(getBestDiscount(p, [rule({ percentage: 10 }), rule({ type: 'product', productIds: [7], percentage: 30 })], global).percentage, 30);
// inactive / out-of-range / other product rules are ignored
assert.equal(getBestDiscount(p, [rule({ active: false, percentage: 90 }), rule({ minPrice: 201 }), rule({ maxPrice: 199 }), rule({ type: 'product', productIds: [8] })], null), null);
// boundaries are inclusive
assert.equal(getBestDiscount(p, [rule({ minPrice: 200, maxPrice: 200 })], null).percentage, 10);
assert.equal(applyDiscount(189, { percentage: 50, label: '' }), 95);
assert.equal(applyDiscount(189, null), 189);
console.log('discounts ok');
