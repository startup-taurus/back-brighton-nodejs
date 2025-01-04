const { Router } = require('express');

module.exports = function ({ CancelledLessonController }) {
  const router = Router();
  router.get(
    '/get-all-by-course/:courseId',
    CancelledLessonController.getCancelledLessonsByCourse
  );
  router.post('/create', CancelledLessonController.create);
  router.post('/delete', CancelledLessonController.delete);
  router.patch('/update/:id', CancelledLessonController.update);

  return router;
};
