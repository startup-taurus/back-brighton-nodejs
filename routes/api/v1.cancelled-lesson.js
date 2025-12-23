const { Router } = require('express');
const { requirePermissions, requireAnyPermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions');

module.exports = function ({ CancelledLessonController, AuthMiddleware }) {
  const router = Router();
  router.get(
    '/get-all-by-course/:courseId',
    [
      AuthMiddleware,
      requireAnyPermissions(PERMISSIONS.VIEW_CANCELLED_LESSONS, PERMISSIONS.VIEW_HOLIDAYS),
    ],
    CancelledLessonController.getCancelledLessonsByCourse
  );
  router.post(
    '/create',
    [
      AuthMiddleware,
      requirePermissions(PERMISSIONS.CREATE_CANCELLED_LESSON),
    ],
    CancelledLessonController.create
  );
  router.post(
    '/delete',
    [
      AuthMiddleware,
      requirePermissions(PERMISSIONS.VIEW_CANCELLED_LESSONS),
    ],
    CancelledLessonController.delete
  );
  router.patch(
    '/update/:id',
    [
      AuthMiddleware,
      requirePermissions(PERMISSIONS.EDIT_CANCELLED_LESSON),
    ],
    CancelledLessonController.update
  );

  return router;
};
