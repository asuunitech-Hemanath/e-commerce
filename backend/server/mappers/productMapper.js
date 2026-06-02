const mapProduct = (product) => {
  const price = parseFloat(product.price) || 0;
  const oldPrice = product.oldPrice ? parseFloat(product.oldPrice) : null;
  const rating = parseFloat(product.rating) || 0;
  const stock = parseFloat(product.stock) || 0;

  return {
    id: product.id,

    name: product.name || "Unknown",

    brand: product.brand,

    category: product.category,

    categoryId: product.category_id,

    price: price,

    oldPrice: oldPrice,

    rating: rating,

    badge: product.badge,

    img: product.img,

    description: product.description,

    stock: stock,

    specifications: product.specifications,

    media: product.media || [],
  };
};

module.exports = mapProduct;