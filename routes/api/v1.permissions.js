const { Router } = require('express');
const router = Router();

module.exports = function({ PermissionsController, AuthMiddleware }) { // Asegúrate de inyectar el AuthMiddleware si lo usas
    
    router.get('/me', AuthMiddleware, PermissionsController.getMyPermissions);
    
    router.get('/roles', AuthMiddleware, PermissionsController.getRoles); 

    router.post('/sync', AuthMiddleware, PermissionsController.syncPermissions);

    router.get('/by-role/:role', AuthMiddleware, PermissionsController.getPermissionsByRole);
    router.put('/by-role/:role', AuthMiddleware, PermissionsController.updatePermissionsByRole);
    router.put('/role/:role', AuthMiddleware, (req, res) => PermissionsController.updateRoleMeta(req, res));

    return router;
};
