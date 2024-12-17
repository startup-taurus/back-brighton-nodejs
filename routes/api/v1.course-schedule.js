const { Router } = require('express');

module.exports = function ({ CourseScheduleController }) {
  const router = Router();
  router.get(
    '/get-syllabus-by-course/:id',
    CourseScheduleController.getCourseScheduleDates
  );

  router.patch(
    '/update-course-schedule/:id',
    CourseScheduleController.updateLessonTaught
  );

  return router;
};
