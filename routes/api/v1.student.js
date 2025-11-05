const { Router } = require('express');
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants')
module.exports = function ({ StudentController, AuthMiddleware }) {
  const router = Router();
  router.get('/get-all', [AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST)], StudentController.getAllStudents);
  router.get('/get-one/:id', StudentController.getStudent);
  router.get('/best-students', StudentController.getBestStudents);
  router.post('/create', StudentController.createStudent);
  router.post('/transfer-and-progress', StudentController.transferAndProgressStudents);
  router.put('/update/:id', StudentController.updateStudent);
  router.put('/update-status/:id', StudentController.updateStudentStatus);
  router.delete('/delete/:id', StudentController.deleteStudent);
  return router;
};
