const { Router } = require('express');
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants');

module.exports = function ({
  CourseController,
  CourseGradingController,
  AuthMiddleware,
  ValidateCourseMiddleware,
}) {
  const router = Router();
  router.get('/get-all', CourseController.getAllCourses);
  router.get('/get-one/:id', CourseController.getCourse);
  router.get(
    '/get-students/:id',
    [
      AuthMiddleware,
      requireRoles(
        USER_TYPES.PROFESSOR,
        USER_TYPES.COORDINATOR,
        USER_TYPES.ADMIN,
        USER_TYPES.RECEPTIONIST,
      ),
      ValidateCourseMiddleware,
    ],
    CourseController.getCourseWithStudents
  );

  router.get(
    '/get-all-with-professors',
    [AuthMiddleware, requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST)],
    CourseController.getAllCoursesWithProfessors
  );
  router.get(
    '/get-all-without-filters',
    CourseController.getAllCoursesWithoutFilters
  );
  router.get('/get-active', CourseController.getActiveCourses);
  router.get(
    '/get-academic-performance',
    CourseController.getAcademicPerformance
  );
  router.get('/get-school-performance', CourseController.getSchoolPerformance);

  router.get(
    '/get-grading-items/:courseId/',
    CourseGradingController.getGradingItemsByCourse
  );
  router.get(
    '/get-grading-percentage-by-syllabus/:syllabusId/',
    CourseGradingController.getGradingPercentageBySyllabus
  );
  router.put(
    '/:courseId/assignment',
    [AuthMiddleware],
    CourseGradingController.upsertCourseAssignmentItem
  );

  router.delete(
    '/:courseId/assignment/:itemId',
    [AuthMiddleware],
    CourseGradingController.deleteCourseAssignmentItem
  );

  router.post(
    '/assignment/delete-batch',
    [AuthMiddleware],
    CourseGradingController.deleteCourseAssignmentItemsBatch
  );

  router.post('/create', CourseController.createCourse);
  router.put('/update/:id', CourseController.updateCourse);
  router.put('/update-status/:id', CourseController.updateCourseStatus);
  router.get(
    '/get-calendar',
    [
      AuthMiddleware,
      requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST)
    ],
    CourseController.getAllCoursesForCalendar
  );
  return router;
};
