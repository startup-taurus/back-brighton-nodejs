const AppError = require('../utils/app-error');
const { USER_TYPES } = require('../utils/constants');

const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(
            ', '
          )}`,
          403
        )
      );
    }

    next();
  };
};

const teacherMiddleware = requireRoles(
  USER_TYPES.PROFESSOR,
  USER_TYPES.ADMIN,
  USER_TYPES.COORDINATOR
);
const coordinatorMiddleware = requireRoles(
  USER_TYPES.COORDINATOR,
  USER_TYPES.ADMIN
);
const adminMiddleware = requireRoles(USER_TYPES.ADMIN);

module.exports = {
  requireRoles,
  teacherMiddleware,
  coordinatorMiddleware,
  adminMiddleware,
};
