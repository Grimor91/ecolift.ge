const db = require('../config/db');

// Attach images to a list of product rows, one query for all of them.
async function withImages(products) {
  if (!products.length) return products;
  const ids = products.map((p) => p.id);
  const [images] = await db.query(
    'SELECT id, product_id, file_name FROM product_images WHERE product_id IN (?) ORDER BY sort_order, id',
    [ids]
  );
  return products.map((p) => ({
    ...p,
    price: p.price === null ? null : Number(p.price),
    in_stock: !!p.in_stock,
    is_active: !!p.is_active,
    images: images
      .filter((img) => img.product_id === p.id)
      .map((img) => ({ id: img.id, url: `/uploads/${img.file_name}` })),
  }));
}

module.exports = { withImages };
