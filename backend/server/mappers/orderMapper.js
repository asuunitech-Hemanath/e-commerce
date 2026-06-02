const mapOrder = (order) => {
  const subtotal = parseFloat(order.subtotal) || 0;
  const shipping = parseFloat(order.shipping) || 0;
  const total = parseFloat(order.total) || 0;

  return {
    id: order.id,

    userId: order.user_id,

    customerName: order.customer_name,

    firstName: order.first_name,

    lastName: order.last_name,

    email: order.email,

    phone: order.phone,

    address: order.address,

    city: order.city,

    country: order.country,

    zip: order.zip,

    notes: order.notes,

    paymentMethod: order.payment_method,

    subtotal: subtotal,

    shipping: shipping,

    total: total,

    status: order.status,

    createdAt: order.created_at,

    items: order.items || [],
  };
};

module.exports = mapOrder;