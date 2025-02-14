const { Router } = require("express");
const upload = require("../../utils/upload");
module.exports = function ({ ProfessorController }) {
  const router = Router();
  router.get("/get-all", ProfessorController.getAllProfessors);
  router.get("/get-one/:id", ProfessorController.getProfessor);
  router.get("/:id/courses", ProfessorController.getProfessorCourses);
  router.get("/get-active", ProfessorController.getActiveProfessors);
  router.get("/get-courses-and-students", ProfessorController.getProfessorsCourseAndStudentCount);
  router.post(
    "/create",
    upload.single("image"),
    ProfessorController.createProfessor
  );
  router.put("/update/:id", ProfessorController.updateProfessor);
  router.put("/update-status/:id", ProfessorController.updateProfessorStatus);
  router.delete("/delete/:id", ProfessorController.deleteProfessor);
  return router;
};
