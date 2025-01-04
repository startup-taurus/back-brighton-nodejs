const { Router } = require("express");

module.exports = function ({ CourseController, CourseGradingController }) {
  const router = Router();
  router.get("/get-all", CourseController.getAllCourses);
  router.get("/get-one/:id", CourseController.getCourse);
  router.get("/get-students/:id", CourseController.getCourseWithStudents);

  router.get(
    "/get-all-with-professors",
    CourseController.getAllCoursesWithProfessors
  );
  router.get(
    "/get-all-without-filters",
    CourseController.getAllCoursesWithoutFilters
  );
  router.get("/get-active", CourseController.getActiveCourses);
  router.get(
    "/get-grading-items/:courseId/",
    CourseGradingController.getGradingItemsByCourse
  );
  router.post("/create", CourseController.createCourse);
  router.put("/update/:id", CourseController.updateCourse);
  router.put("/update-status/:id", CourseController.updateCourseStatus);
  return router;
};
