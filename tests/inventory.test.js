import { describe, it, expect } from 'vitest';
import { groupProductsByName } from '../src/lib/inventory.js';

describe('groupProductsByName', () => {
  it('groups identical names together despite case and extra spaces', () => {
    const groups = groupProductsByName([
      { id: 1, name: '  Filtr   havo ', qty: 2 },
      { id: 2, name: 'filtr havo', qty: 3 },
      { id: 3, name: 'Moy filtr', qty: 4 },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].name).toBe('Filtr havo');
    expect(groups[0].products).toHaveLength(2);
    expect(groups[0].totalQty).toBe(5);
  });

  it('keeps products without a name in separate groups', () => {
    const groups = groupProductsByName([{ id: 1, name: '' }, { id: 2, name: '' }]);
    expect(groups).toHaveLength(2);
  });
});
