const { Router } = require("express");

module.exports = function ({ UserController }) {
  const router = Router();
  router.get("/me", UserController.getMe, UserController.getUser);
  router.get("/get-all", UserController.getAllUsers);
  router.get("/get-one/:id", UserController.getUser);
  router.get("/get-dashboard-data", UserController.getDashboardData);
  router.post("/login", UserController.signIn);
  router.post("/register", UserController.createUser);
  router.put("/update/:id", UserController.updateUser);
  router.put("/update-status/:id", UserController.updateUserStatus);
  router.delete("/delete/:id", UserController.deleteUser);
  return router;
};
