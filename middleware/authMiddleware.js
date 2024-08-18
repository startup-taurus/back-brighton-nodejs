const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");



const protect = ({ Example, config }) => asyncHandler(async (req, res, next) => {
  let token = req.headers["x-api-key"];
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.example = await Example.findOne({ _id: decoded.id }).select("-password");
      next();
    } catch (error) {
      console.log(error);
      res.status(401);
      throw new Error("No autorizado");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("No autorizado, no se envió el token");
  }
});
module.exports = { protect };
