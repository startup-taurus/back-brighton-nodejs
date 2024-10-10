const { Router } = require("express");

module.exports = function ({ CourseController }) {
  const router = Router();
  router.get("/get-all", CourseController.getAllCourses);
  router.get("/get-one/:id", CourseController.getCourse);
  router.get("/get-students/:id", CourseController.getCourseWithStudents);
  router.get(
    "/get-all-with-professors",
    CourseController.getAllCoursesWithProfessors
  );
  router.post("/create", CourseController.createCourse);
  router.put("/update/:id", CourseController.updateCourse);
  return router;
};
