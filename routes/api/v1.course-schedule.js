const { Router } = require('express');
const { requirePermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions');

module.exports = function ({ CourseScheduleController, AuthMiddleware }) {
  const router = Router();
  router.get(
    '/get-syllabus-by-course/:id',
    CourseScheduleController.getCourseScheduleDates
  );

  router.put(
    '/update-course-schedule/:id',
    [
      AuthMiddleware,
      requirePermissions(PERMISSIONS.MARK_ATTENDANCE),
    ],
    CourseScheduleController.updateLessonTaught
  );

  router.put(
    '/reschedule/:id',
    [
      AuthMiddleware,
      requirePermissions(PERMISSIONS.RESCHEDULE_ATTENDANCE_DATE),
    ],
    CourseScheduleController.rescheduleDate
  );

  return router;
};
