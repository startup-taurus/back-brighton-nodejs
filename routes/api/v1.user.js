const { Router } = require("express");
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants')

module.exports = function ({ UserController, AuthMiddleware }) {
  const router = Router();
  router.get("/me", UserController.getMe, UserController.getUser);
  router.get("/get-all", [AuthMiddleware,
    requireRoles( USER_TYPES.ADMIN)],UserController.getAllUsers);
  router.get("/get-one/:id", UserController.getUser);
  router.get("/get-dashboard-data",AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST),  UserController.getDashboardData);
  router.post("/login", UserController.signIn);
  router.post("/register", UserController.createUser);
  router.put("/update/:id", UserController.updateUser);
  router.put("/update-status/:id", UserController.updateUserStatus);
  router.delete("/delete/:id", UserController.deleteUser);
  return router;
};
