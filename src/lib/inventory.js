export function groupProductsByName(products = []) {
  const groups = new Map();
  products.forEach((product, index) => {
    const displayName = String(product.name ?? '').trim().replace(/\s+/g, ' ');
    const normalized = displayName.toLocaleLowerCase('uz-UZ');
    // Products without a name must not accidentally be combined into one group.
    const key = normalized || `__unnamed_${product.id ?? index}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name: displayName || 'Nomi kiritilmagan mahsulot',
        products: [],
        totalQty: 0,
      });
    }
    const group = groups.get(key);
    group.products.push(product);
    group.totalQty += Number(product.qty) || 0;
  });
  return [...groups.values()];
}
