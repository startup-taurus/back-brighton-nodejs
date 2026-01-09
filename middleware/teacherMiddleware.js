const AppError = require('../utils/app-error');
const requireRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(r => String(r).trim().toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthenticated user', 401));
    }
    const currentRole = String(req.user.role || '').trim().toLowerCase();
    if (!normalizedAllowed.includes(currentRole)) {
      return next(
        new AppError(
          `Access denied. One of these roles is required.: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }
    next();
  };
};

const buildPermissionsMiddleware = (requiredPermissions, permissionCheck, errorMessageBuilder) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthenticated user', 401));
    }
    const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const hasAccess = permissionCheck(userPermissions, requiredPermissions);
    if (!hasAccess) {
      return next(new AppError(errorMessageBuilder(requiredPermissions), 403));
    }
    next();
  };
};

const requirePermissions = (...needed) => {
  return buildPermissionsMiddleware(
    needed,
    (userPermissions, requiredPermissions) => requiredPermissions.every(requiredPermission => userPermissions.includes(requiredPermission)),
    (requiredPermissions) => `Access denied. Permissions required: ${requiredPermissions.join(', ')}`
  );
};

const requireAnyPermissions = (...options) => {
  return buildPermissionsMiddleware(
    options,
    (userPermissions, requiredPermissions) => requiredPermissions.some(requiredPermission => userPermissions.includes(requiredPermission)),
    (requiredPermissions) => `Access denied. One of these permissions is required: ${requiredPermissions.join(', ')}`
  );
};


module.exports = {
  requireRoles,
  requirePermissions,
  requireAnyPermissions,
};
