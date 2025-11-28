const { Router } = require('express');

module.exports = function ({ PermissionsController, AuthMiddleware }) {
  const router = Router();
  router.get('/me', [AuthMiddleware], PermissionsController.getMyPermissions);
  router.get('/by-role/:role', [AuthMiddleware], PermissionsController.getPermissionsByRole);
  router.patch('/by-role/:role', [AuthMiddleware], PermissionsController.updatePermissionsByRole);
  return router;
};
