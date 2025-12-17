const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { promisify } = require("util");
const AppError = require("../utils/app-error");

const protect = ({ User, config, PermissionsService }) =>
  asyncHandler(async (req, res, next) => {
    let authorization = req.headers["authorization"];
    let token;
    
    if (authorization && authorization.startsWith("Bearer")) {
      token = authorization.split(" ")[1]; 
    }

    if (!token) {
      return next(new AppError("El token es invalido", 401));
    }

    try {
      if (!token || token === 'undefined' || token === 'null') {
        return next(new AppError("Token inválido o vacío", 401));
      }

      const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);
      
      if (!decoded || !decoded.id) {
        return next(new AppError("Token no contiene información válida", 401));
      }

      req.user = await User.User.findByPk(decoded.id);

      if (!req.user) {
        return next(new AppError("No existe el usuario", 404));
      }

      const perms = await PermissionsService.getPermissionsForUser(req.user);
      req.user.permissions = Array.isArray(perms?.data) ? perms.data : [];

      next();
    } catch (error) {
      console.log('Error en authMiddleware:', error.message);
      
      if (error.message === "jwt malformed") {
        return next(new AppError("Token mal formado. Verifica que el token sea válido.", 400));
      }
      
      if (error.message === "invalid token") {
        return next(new AppError("Token inválido", 401));
      }
      
      if (error.message === "jwt expired") {
        return next(new AppError("Token expirado", 401));
      }

      return next(new AppError("Error de autenticación", 401));
    }
  });

module.exports = protect;
