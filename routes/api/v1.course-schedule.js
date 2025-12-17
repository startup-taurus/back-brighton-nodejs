const { Router } = require('express');
const { requireRoles, requirePermissions } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants');
const { PERMISSIONS } = require('../../utils/permissions');

module.exports = function ({ CourseScheduleController, AuthMiddleware }) {
  const router = Router();
  router.get(
    '/get-syllabus-by-course/:id',
    CourseScheduleController.getCourseScheduleDates
  );

  router.patch(
    '/update-course-schedule/:id',
    [
      AuthMiddleware,
      requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN),
      requirePermissions(PERMISSIONS.MARK_ATTENDANCE),
    ],
    CourseScheduleController.updateLessonTaught
  );

  return router;
};
