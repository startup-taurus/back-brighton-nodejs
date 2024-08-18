const { Router } = require("express");

module.exports = function ({ PaymentController }) {
  const router = Router();
  router.get("/get-by-user/:id", PaymentController.getPaymentByUser);
  router.post("/create", PaymentController.createPayment);
  router.put("/update/:id", PaymentController.updatePayment);
  return router;
};
