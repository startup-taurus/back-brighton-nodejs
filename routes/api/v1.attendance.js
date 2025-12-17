const { Router } = require('express');
const { requireRoles, requirePermissions } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants');
const { PERMISSIONS } = require('../../utils/permissions');

module.exports = function ({ AttendanceController, AuthMiddleware }) {
  const router = Router();
  router.get('/get-by-course/:id', AttendanceController.getAttendanceByCourse);
  router.get(
    '/get-attendance-by-student/course/:courseId/student/:studentId',
    AttendanceController.getAttendanceByCourseAndStudent
  );
  router.post(
    '/create',
    [
      AuthMiddleware,
      requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN),
      requirePermissions(PERMISSIONS.MARK_ATTENDANCE),
    ],
    AttendanceController.createAttendance
  );
  router.get('/consecutive-absences-report', AttendanceController.getConsecutiveAbsencesReport);
  return router;
};
