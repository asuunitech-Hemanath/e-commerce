const convertOrderInput = (body) => {
  return {
    userId: Number(body.userId),

    first_name: body.first_name?.trim(),

    last_name: body.last_name?.trim() || null,

    email: body.email?.trim(),

    phone: body.phone?.trim(),

    address: body.address?.trim(),

    city: body.city?.trim(),

    country: body.country?.trim(),

    zip: body.zip?.trim(),

    notes: body.notes?.trim() || null,

    payment_method:
      body.payment_method || "card",
  };
};

module.exports = convertOrderInput;