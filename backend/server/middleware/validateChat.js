module.exports = (req, res, next) => {

  const { message } = req.body;

  if (
    !message ||
    typeof message !== "string"
  ) {
    return res.status(400).json({
      error: "Invalid message",
    });
  }

  next();
};