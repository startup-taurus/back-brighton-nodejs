const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/app-error");

const protect = ({ Users, config }) =>
  asyncHandler(async (req, res, next) => {
    let authorization = req.headers["authorization"];
    let token;
    if (authorization && authorization.startsWith("Bearer")) {
      token = authorization && authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("El token es invalido", 401));
    }

    try {
      const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);
      req.user = await _user.findByPk(decoded.id);

      next();
    } catch (error) {
      if (error.message === "jwt malformed") {
        return next(new AppError("Token mal formado", 400));
      }

      console.log(error);
      return next(new AppError("No existe el usuario", 404));
    }
  });
module.exports = { protect };
