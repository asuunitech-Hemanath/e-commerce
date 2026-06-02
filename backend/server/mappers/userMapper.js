const mapUser = (user) => {
  return {
    id: user.id,

    name: user.name,

    email: user.email,

    role: user.role,

    createdAt: user.created_at,
  };
};

module.exports = mapUser;