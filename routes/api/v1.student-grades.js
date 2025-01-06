const { Router } = require('express');

module.exports = function ({ StudentGradesController }) {
  const router = Router();
  router.get(
    '/get-grades-by-course/:id',
    StudentGradesController.getGradesByCourse
  );
  router.get(
    '/get-grades-by-course-and-student/:courseId/:studentId',
    StudentGradesController.getGradesByCourseAndStudent
  );
  router.patch('/update', StudentGradesController.createStudentGrade);

  return router;
};
