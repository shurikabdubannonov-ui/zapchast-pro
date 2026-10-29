import { describe, it, expect } from 'vitest';
import { mapProductRows, productIdentity } from '../src/lib/productImport.js';

describe('Excel product import', () => {
  it('maps Uzbek headers and accepts comma decimal prices', () => {
    const products = mapProductRows([
      ['Mahsulot nomi', 'Kategoriya', 'O‘lcham / model', 'Qoldiq', 'Tannarx', 'Optom narx', 'Dona narx'],
      ['Havo filtri', 'Filtrlar', 'A-12', 5, '1,32', '2,50', '3,75'],
    ], 'Varaq');
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({ name: 'Havo filtri', category: 'Filtrlar', size: 'A-12', qty: 5, cost: 1.32, wholesale: 2.5, retail: 3.75 });
  });

  it('uses first column as product name when headers are not recognized', () => {
    const products = mapProductRows([['Item', 'Qty'], ['Moy filtri', 4]], 'Ehtiyot qismlar');
    expect(products[0].name).toBe('Moy filtri');
  });

  it('creates a stable matching identity from name, size and category', () => {
    expect(productIdentity({ name: ' Havo   Filtri ', size: 'A-1', category: 'Filtrlar' }))
      .toBe(productIdentity({ name: 'havo filtri', size: 'A-1', category: 'filtrlar' }));
  });
});
