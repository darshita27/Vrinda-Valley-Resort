const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ msg: "No token, access denied" });
  }

  // 🔥 FIX: Extract token after Bearer
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "secret123"); // MUST match login
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Invalid token" });
  }
};
