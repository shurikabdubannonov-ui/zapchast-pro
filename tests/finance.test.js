import { describe, it, expect } from 'vitest';
import { parseMoney, calculateSale } from '../src/lib/finance.js';
describe('parseMoney', () => {
  it('accepts decimal comma as a decimal point', () => expect(parseMoney('1,32')).toBe(1.32));
  it('accepts decimal point', () => expect(parseMoney('2.50')).toBe(2.5));
  it('trims whitespace', () => expect(parseMoney(' 10,75 ')).toBe(10.75));
  it('returns zero for an empty field', () => expect(parseMoney('')).toBe(0));
});
describe('calculateSale', () => {
  it('calculates revenue, cost and gross profit', () => {
    expect(calculateSale([{qty: 2, price: 5, cost: 3}, {qty: 1, price: 4, cost: 2}]))
      .toEqual({total: 14, costTotal: 8, grossProfit: 6});
  });
});
