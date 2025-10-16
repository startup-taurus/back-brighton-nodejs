const { Router } = require("express");
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants');
const { upload } = require('../../utils/upload');

module.exports = function ({ UserController, AuthMiddleware }) {
  const router = Router();
  router.get("/me", UserController.getMe, UserController.getUser);
  router.get("/get-all", [AuthMiddleware,
    requireRoles( USER_TYPES.ADMIN)],UserController.getAllUsers);
  router.get("/get-one/:id", UserController.getUser);
  router.get("/get-dashboard-data",AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST),  UserController.getDashboardData);
  router.post("/login", UserController.signIn);
  router.post("/register", upload.single('image'), UserController.createUser);
  router.put("/update/:id",  upload.single('image'), UserController.updateUser);
  router.put("/update-status/:id", UserController.updateUserStatus);
  router.put("/reset-failed-attempts/:id", [AuthMiddleware, requireRoles(USER_TYPES.ADMIN)], UserController.resetFailedAttempts);
  router.delete("/delete/:id", UserController.deleteUser);
  return router;
};
