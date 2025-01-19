const { Router } = require('express');

module.exports = function ({ SyllabusController }) {
  const router = Router();

  router.get('/get-all', SyllabusController.getAllSyllabus);
  router.get('/get-one/:id', SyllabusController.getSyllabusById);
  router.get('/get-syllabus/:id', SyllabusController.getIdSyllabus);
  router.get(
    '/get-percentages-by-syllabus/:id',
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
  // router.delete("/delete/:id", SyllabusController.deleteSyllabus);
  return router;
};
