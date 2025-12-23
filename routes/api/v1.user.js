const { Router } = require("express");
const { requirePermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions');
const { upload } = require('../../utils/upload');

module.exports = function ({ UserController, AuthMiddleware }) {
  const router = Router();
  router.get("/me", UserController.getMe, UserController.getUser);
  router.get("/get-all", [AuthMiddleware,
    requirePermissions(PERMISSIONS.VIEW_USERS)],UserController.getAllUsers);
  router.get("/get-one/:id", UserController.getUser);
  router.get("/get-dashboard-data",AuthMiddleware,
    requirePermissions(PERMISSIONS.VIEW_DASHBOARD),  UserController.getDashboardData);
  router.post("/login", UserController.signIn);
  router.post("/register", upload.single('image'), UserController.createUser);
  router.put("/update/:id",  upload.single('image'), UserController.updateUser);
  router.put("/update-status/:id", [AuthMiddleware, requirePermissions(PERMISSIONS.TOGGLE_USER_STATUS)], UserController.updateUserStatus);
  router.put("/reset-failed-attempts/:id", [AuthMiddleware, requirePermissions(PERMISSIONS.ACTIVATE_USER)], UserController.resetFailedAttempts);
  router.delete("/delete/:id", UserController.deleteUser);
  return router;
};
