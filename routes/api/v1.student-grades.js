const { Router } = require('express');
const { requirePermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions');

module.exports = function ({ StudentGradesController, AuthMiddleware }) {
  const router = Router();
  
  router.get(
    '/get-grades-by-course/:id',
    [AuthMiddleware, requirePermissions(PERMISSIONS.VIEW_GRADEBOOK)],
    StudentGradesController.getGradesByCourse
  );
  
  router.get(
    '/get-grades-by-course-and-student/:courseId/:studentId',
    [AuthMiddleware, requirePermissions(PERMISSIONS.VIEW_GRADEBOOK)], 
    StudentGradesController.getGradesByCourseAndStudent
  );
  
  router.put(
    '/update',
    [AuthMiddleware, requirePermissions(PERMISSIONS.EDIT_GRADES)],
    StudentGradesController.createStudentGrade
  );
  
  router.get(
    '/get-grades-by-course/:id',
    [AuthMiddleware, requirePermissions(PERMISSIONS.VIEW_GRADEBOOK)],
    StudentGradesController.getGradesByCourse
  );
  
  return router;
};
