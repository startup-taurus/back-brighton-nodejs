const { Router } = require('express');
const { requireRoles, requirePermissions } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants');
const { PERMISSIONS } = require('../../utils/permissions');

module.exports = function ({ CancelledLessonController, AuthMiddleware }) {
  const router = Router();
  router.get(
    '/get-all-by-course/:courseId',
    [
      AuthMiddleware,
      requireRoles(
        USER_TYPES.PROFESSOR,
        USER_TYPES.COORDINATOR,
        USER_TYPES.ADMIN,
        USER_TYPES.RECEPTIONIST
      ),
      requirePermissions(PERMISSIONS.VIEW_CANCELLED_LESSONS),
    ],
    CancelledLessonController.getCancelledLessonsByCourse
  );
  router.post(
    '/create',
    [
      AuthMiddleware,
      requireRoles(USER_TYPES.PROFESSOR, USER_TYPES.COORDINATOR, USER_TYPES.ADMIN),
      requirePermissions(PERMISSIONS.CREATE_CANCELLED_LESSON),
    ],
    CancelledLessonController.create
  );
  router.post(
    '/delete',
    [
      AuthMiddleware,
      requireRoles(
        USER_TYPES.PROFESSOR,
        USER_TYPES.COORDINATOR,
        USER_TYPES.ADMIN,
        USER_TYPES.RECEPTIONIST
      ),
      requirePermissions(PERMISSIONS.VIEW_CANCELLED_LESSONS),
    ],
    CancelledLessonController.delete
  );
  router.patch(
    '/update/:id',
    [
      AuthMiddleware,
      requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN),
      requirePermissions(PERMISSIONS.EDIT_CANCELLED_LESSON),
    ],
    CancelledLessonController.update
  );

  return router;
};
