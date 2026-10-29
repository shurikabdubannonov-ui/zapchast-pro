import { parseMoney } from './finance.js';

const normalize = (value) => String(value ?? '')
  .trim()
  .toLocaleLowerCase('uz-UZ')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[ʻʼ‘’`']/g, '')
  .replace(/[^a-z0-9а-яё]+/gi, ' ')
  .trim();

const aliases = {
  name: ['name', 'product', 'product name', 'nomi', 'mahsulot', 'mahsulot nomi', 'tovar', 'товар', 'наименование', 'название'],
  category: ['category', 'kategoriya', 'toifa', 'tur', 'категория'],
  size: ['size', 'model', 'olcham', 'o‘lcham', 'o‘lcham model', 'olcham model', 'razmer', 'kod', 'артикул', 'модель'],
  qty: ['qty', 'quantity', 'dona', 'miqdor', 'qoldiq', 'soni', 'ombor', 'остаток', 'количество'],
  limit: ['limit', 'minimal qoldiq', 'min qoldiq', 'minimum', 'минимум'],
  cost: ['cost', 'tannarx', 'kelib tushgan narx', 'kelib tushgan narxi', 'purchase price', 'закупочная цена'],
  wholesale: ['wholesale', 'optom', 'optom narx', 'optom narhi', 'оптовая цена'],
  retail: ['retail', 'dona narx', 'dona narhi', 'sotuv narxi', 'selling price', 'розничная цена'],
};

export function mapProductRows(rows, sheetName = 'Excel') {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const headers = rows[0].map(normalize);
  const indexes = {};
  for (const [field, names] of Object.entries(aliases)) {
    const candidates = names.map(normalize);
    indexes[field] = headers.findIndex((header) => candidates.includes(header));
  }
  if (indexes.name < 0) indexes.name = 0;
  const get = (row, field) => indexes[field] >= 0 ? row[indexes[field]] : undefined;
  const asNumber = (value, fallback = 0) => {
    if (value === undefined || value === null || String(value).trim() === '') return fallback;
    const parsed = typeof value === 'number' ? value : parseMoney(String(value).replace(/\s/g, '').replace(/\$/g, ''));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };
  return rows.slice(1).map((row, index) => {
    const name = String(get(row, 'name') ?? '').trim();
    if (!name) return null;
    const categoryValue = String(get(row, 'category') ?? '').trim();
    return {
      id: `xlsx-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      category: categoryValue || sheetName || 'Boshqa',
      size: String(get(row, 'size') ?? '').trim(),
      qty: asNumber(get(row, 'qty')),
      limit: asNumber(get(row, 'limit')),
      cost: asNumber(get(row, 'cost')),
      wholesale: asNumber(get(row, 'wholesale')),
      retail: asNumber(get(row, 'retail')),
    };
  }).filter(Boolean);
}

export function productIdentity(product) {
  return [product.name, product.size, product.category].map(normalize).join('|');
}
