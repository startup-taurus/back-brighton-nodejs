const { Router } = require('express');

module.exports = function ({ CancelledLessonController }) {
  const router = Router();
  router.post('/create', CancelledLessonController.create);
  router.patch('/update', CancelledLessonController.update);

  router.get(
    '/get-all-by-course/:courseId',
    CancelledLessonController.getCancelledLessonsByCourse
  );
  return router;
};
