const AppError = require('../utils/app-error');
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthenticated user', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. One of these roles is required.: ${allowedRoles.join(
            ', '
          )}`,
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  requireRoles,
};
