const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const { ROLE_PERMISSIONS } = require('../utils/permissions');

module.exports = class PermissionsService extends BaseService {
  constructor() {
    super();
  }

  getPermissionsByRole = catchServiceAsync(async (role) => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return { data: permissions };
  });

  getPermissionsForUser = catchServiceAsync(async (user) => {
    const role = user?.role;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return { data: permissions };
  });

  setPermissionsByRole = catchServiceAsync(async (role, permissions) => {
    if (!role || !Array.isArray(permissions)) {
      return { data: [], message: 'Invalid payload' };
    }
    ROLE_PERMISSIONS[role] = permissions;
    return { data: ROLE_PERMISSIONS[role] };
  });
};
