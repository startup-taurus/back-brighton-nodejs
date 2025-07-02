const { Router } = require('express');
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants'); 

module.exports = function ({ StudentGradesController, AuthMiddleware }) {
  const router = Router();
  
  router.get(
    '/get-grades-by-course/:id',
    AuthMiddleware,
    requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN),
    StudentGradesController.getGradesByCourse
  );
  
  router.get(
    '/get-grades-by-course-and-student/:courseId/:studentId',
    AuthMiddleware,
    requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN), 
    StudentGradesController.getGradesByCourseAndStudent
  );
  
  router.patch(
    '/update',
    AuthMiddleware,
    requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN),
    StudentGradesController.createStudentGrade
  );
  
  router.get(
    '/get-grades-by-course/:id',
    AuthMiddleware,
    requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN),
    StudentGradesController.getGradesByCourse
  );
  
  return router;
};