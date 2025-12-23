const { Router } = require('express');
const { requirePermissions, requireAnyPermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions');
module.exports = function ({ SyllabusController, AuthMiddleware }) {
  const router = Router();

  router.get('/get-all', [
    AuthMiddleware,
    requireAnyPermissions(PERMISSIONS.VIEW_SYLLABUS, PERMISSIONS.VIEW_COURSES)
  ], SyllabusController.getAllSyllabus);
  router.get('/get-one/:id',  [
    AuthMiddleware,
    requireAnyPermissions(PERMISSIONS.VIEW_SYLLABUS, PERMISSIONS.VIEW_COURSES)
  ], SyllabusController.getSyllabusById);
  router.get('/get-syllabus/:id', SyllabusController.getIdSyllabus);
  router.get(
    '/get-percentages-by-syllabus/:id',
    [
      AuthMiddleware,
      requireAnyPermissions(PERMISSIONS.VIEW_SYLLABUS, PERMISSIONS.VIEW_COURSES, PERMISSIONS.VIEW_GRADEBOOK)
    ],
    SyllabusController.getFinalPercentageBySyllabusId
  );
  router.post('/create', SyllabusController.createSyllabus);
  router.post(
    '/create-assignment-item',
    SyllabusController.createAssignmentGradingItem
  );
  router.put(
    '/update-assignment-item',
    SyllabusController.updateAssignmentGradingItem
  );
  router.put('/update/:id', SyllabusController.updateSyllabus);
  router.put('/update-exam-types', SyllabusController.updateExamTypes);
  return router;
};
