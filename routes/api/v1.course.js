const { Router } = require('express');
const { requirePermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions');

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
      requirePermissions(PERMISSIONS.VIEW_COURSES),
      ValidateCourseMiddleware,
    ],
    CourseController.getCourseWithStudents
  );

  router.get(
    '/get-all-with-professors',
    [AuthMiddleware, requirePermissions(PERMISSIONS.VIEW_COURSES)],
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
    [AuthMiddleware, requirePermissions(PERMISSIONS.EDIT_GRADES)],
    CourseGradingController.upsertCourseAssignmentItem
  );

  router.delete(
    '/:courseId/assignment/:itemId',
    [AuthMiddleware, requirePermissions(PERMISSIONS.DELETE_GRADES)],
    CourseGradingController.deleteCourseAssignmentItem
  );

  router.post(
    '/assignment/delete-batch',
    [AuthMiddleware, requirePermissions(PERMISSIONS.DELETE_GRADES)],
    CourseGradingController.deleteCourseAssignmentItemsBatch
  );

  router.post('/create', CourseController.createCourse);
  router.put('/update/:id', CourseController.updateCourse);
  router.put(
    '/update-status/:id',
    [AuthMiddleware, requirePermissions(PERMISSIONS.TOGGLE_COURSE_STATUS)],
    CourseController.updateCourseStatus
  );

  router.post(
    '/deactivate-and-create',
    [AuthMiddleware, requirePermissions(PERMISSIONS.TOGGLE_COURSE_STATUS)],
    CourseController.deactivateAndCreateCourse
  );

  router.get(
    '/get-calendar',
    [
      AuthMiddleware,
      requirePermissions(PERMISSIONS.VIEW_COURSES)
    ],
    CourseController.getAllCoursesForCalendar
  );
  return router;
};
