const { Router } = require('express');
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants')
module.exports = function ({ SyllabusController, AuthMiddleware }) {
  const router = Router();

  router.get('/get-all', [AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN)], SyllabusController.getAllSyllabus);
  router.get('/get-one/:id',  [AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN)], SyllabusController.getSyllabusById);
  router.get('/get-syllabus/:id', SyllabusController.getIdSyllabus);
  router.get(
    '/get-percentages-by-syllabus/:id',
    [AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.PROFESSOR, USER_TYPES.RECEPTIONIST)],
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
