const { Router } = require('express');

module.exports = function ({ SyllabusController }) {
  const router = Router();

  router.get('/get-all', SyllabusController.getAllSyllabus);
  router.get('/get-one/:id', SyllabusController.getSyllabusById);
  router.get('/get-syllabus/:id', SyllabusController.getIdSyllabus);
  router.post('/create', SyllabusController.createSyllabus);
  router.put('/update/:id', SyllabusController.updateSyllabus);
  // router.delete("/delete/:id", SyllabusController.deleteSyllabus);
  return router;
};
