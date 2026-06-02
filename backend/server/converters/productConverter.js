const convertProductInput = (body) => {
  return {
    name: body.name?.trim(),

    brand: body.brand?.trim() || null,

    category_id: body.category_id
      ? Number(body.category_id)
      : null,

    price: Number(body.price),

    old_price: body.old_price
      ? Number(body.old_price)
      : null,

    rating: body.rating
      ? Number(body.rating)
      : 4,

    badge: body.badge || null,

    description: body.description?.trim() || null,

    stock: body.stock
      ? Number(body.stock)
      : 0,

    specifications: body.specifications || null,
  };
};

module.exports = convertProductInput;