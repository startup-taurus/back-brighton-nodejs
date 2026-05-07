const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { promisify } = require("util");
const AppError = require("../utils/app-error");
const cache = require("../utils/cache");

const protect = ({ User, Role, config, PermissionsService }) =>
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

      let user = cache.get('authUser', decoded.id);
      if (!user) {
        const userInstance = await User.User.findByPk(decoded.id, {
          attributes: ['id', 'name', 'email', 'username', 'role', 'role_id', 'status', 'image'],
          include: [{
            model: Role.Role,
            as: 'role_info',
            attributes: ['id', 'name'],
          }],
        });

        if (!userInstance) {
          return next(new AppError("The user does not exist", 404));
        }

        user = userInstance.get({ plain: true });
        cache.set('authUser', decoded.id, user);
      }
      req.user = user;

      const roleName = user.role_info?.name || user.role || null;
      let perms = roleName ? cache.get('authPerms', roleName) : null;
      if (!perms) {
        const result = await PermissionsService.getPermissionsByRole(roleName);
        perms = Array.isArray(result?.data) ? result.data : [];
        if (roleName) cache.set('authPerms', roleName, perms);
      }
      req.user.permissions = perms;

      next();
    } catch (error) {

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
