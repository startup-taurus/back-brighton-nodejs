const { Router } = require('express');

module.exports = function ({ StudentController }) {
  const router = Router();
  router.get('/get-all', StudentController.getAllStudents);
  router.get('/get-one/:id', StudentController.getStudent);
  router.get('/get-distinct-levels', StudentController.getDistinctLevels);
  router.post('/create', StudentController.createStudent);
  router.put('/update/:id', StudentController.updateStudent);
  router.put('/update-status/:id', StudentController.updateStudentStatus);
  router.delete('/delete/:id', StudentController.deleteStudent);
  return router;
};
