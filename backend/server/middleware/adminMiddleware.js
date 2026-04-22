module.exports = (req, res, next) => {
  // 1️⃣ check if user exists
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized ❌" });
  }

  // 2️⃣ check role
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only ❌" });
  }

  next();
};