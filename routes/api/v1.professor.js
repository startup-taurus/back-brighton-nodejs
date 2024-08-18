const { Router } = require("express");

module.exports = function ({ ProfessorController }) {
  const router = Router();
  router.get("/get-all", ProfessorController.getAllProfessors);
  router.get("/get-one/:id", ProfessorController.getProfessor);
  router.post("/create", ProfessorController.createProfessor);
  router.put("/update/:id", ProfessorController.updateProfessor);
  router.delete("/delete/:id", ProfessorController.deleteProfessor);
  return router;
};
