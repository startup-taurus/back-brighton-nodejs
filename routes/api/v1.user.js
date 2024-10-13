const { Router } = require("express");

module.exports = function ({ UserController }) {
  const router = Router();
  router.get("/get-all", UserController.getAllUsers);
  router.get("/get-one/:id", UserController.getUser);
  router.post("/login", UserController.signIn);
  router.post("/register", UserController.createUser);
  router.put("/update/:id", UserController.updateUser);
  router.delete("/delete/:id", UserController.deleteUser);
  router.get("/me", UserController.getMe, UserController.getUser);

  return router;
};
