const { Router } = require('express');

module.exports = function ({ AttendanceController }) {
  const router = Router();
  router.get('/get-by-course/:id', AttendanceController.getAttendanceByCourse);
  router.get(
    '/get-attendance-by-student/course/:courseId/student/:studentId',
    AttendanceController.getAttendanceByCourseAndStudent
  );
  router.post('/create', AttendanceController.createAttendance);
  router.get('/consecutive-absences-report', AttendanceController.getConsecutiveAbsencesReport);
  return router;
};
