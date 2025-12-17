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

const buildPermissionsMiddleware = (perms, checkFn, errorBuilder) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthenticated user', 401));
    }
    const userPerms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const ok = checkFn(userPerms, perms);
    if (!ok) {
      return next(new AppError(errorBuilder(perms), 403));
    }
    next();
  };
};

const requirePermissions = (...needed) => {
  return buildPermissionsMiddleware(
    needed,
    (userPerms, perms) => perms.every(p => userPerms.includes(p)),
    (perms) => `Access denied. Permissions required: ${perms.join(', ')}`
  );
};

const requireAnyPermissions = (...options) => {
  return buildPermissionsMiddleware(
    options,
    (userPerms, perms) => perms.some(p => userPerms.includes(p)),
    (perms) => `Access denied. One of these permissions is required: ${perms.join(', ')}`
  );
};


module.exports = {
  requireRoles,
  requirePermissions,
  requireAnyPermissions,
};
