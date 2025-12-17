const { Router } = require('express');
const { requireRoles, requirePermissions } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants'); 
const { PERMISSIONS } = require('../../utils/permissions');

module.exports = function ({ StudentGradesController, AuthMiddleware }) {
  const router = Router();
  
  router.get(
    '/get-grades-by-course/:id',
    [AuthMiddleware,
    requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST)],
    StudentGradesController.getGradesByCourse
  );
  
  router.get(
    '/get-grades-by-course-and-student/:courseId/:studentId',
    [AuthMiddleware,
    requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST)], 
    StudentGradesController.getGradesByCourseAndStudent
  );
  
  router.patch(
    '/update',
    [AuthMiddleware,
    requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST),
    requirePermissions(PERMISSIONS.EDIT_GRADES)],
    StudentGradesController.createStudentGrade
  );
  
  router.get(
    '/get-grades-by-course/:id',
    [AuthMiddleware,
    requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST)],
    StudentGradesController.getGradesByCourse
  );
  
  return router;
};
