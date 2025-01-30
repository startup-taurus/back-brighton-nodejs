const { Router } = require('express');

module.exports = function ({ RegisteredStudentController }) {
  const router = Router();
  router.get('/get-all', RegisteredStudentController.getAllRegisteredStudents);
  router.get('/get-one/:id', RegisteredStudentController.getStudent);
  router.post('/create', RegisteredStudentController.createStudent);
  router.put('/update/:id', RegisteredStudentController.updateStudent);
  router.delete('/delete/:id', RegisteredStudentController.deleteStudent);

  return router;
};
