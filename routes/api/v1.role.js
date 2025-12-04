const { Router } = require('express');
const router = Router();

module.exports = function({ RoleController, AuthMiddleware }) {
  router.get('/', AuthMiddleware, (req, res) => RoleController.getAllRoles(req, res));
  router.patch('/:role', AuthMiddleware, (req, res) => RoleController.updateRole(req, res));
  router.put('/:role', AuthMiddleware, (req, res) => RoleController.updateRole(req, res));
  router.post('/', AuthMiddleware, (req, res) => RoleController.createRole(req, res));
  return router;
};