const mapCartItem = (item) => ({
  id: Number(item.id),

  userId: Number(item.user_id),

  productId: Number(item.product_id),

  qty: Number(item.qty),

  addedAt: item.added_at || null,

  name: item.name || "",

  img: item.img || "",

  price: Number(item.price || 0),

  lineTotal: Number(item.line_total || 0),
});

module.exports = mapCartItem;