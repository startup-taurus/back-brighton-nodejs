const { Router } = require('express');
const { upload } = require('../../utils/upload');
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants');

module.exports = function ({ ProfessorController, AuthMiddleware }) {
  const router = Router();
  router.get('/get-all', [
      AuthMiddleware,
      requireRoles(
        USER_TYPES.ADMIN,
        USER_TYPES.COORDINATOR,
        USER_TYPES.RECEPTIONIST
      ),
    ],ProfessorController.getAllProfessors);
  router.get('/get-one/:id', ProfessorController.getProfessor);
  router.get('/:id/courses',  ProfessorController.getProfessorCourses);
  router.get('/get-active', ProfessorController.getActiveProfessors);
  router.get(
    '/get-courses-and-students',
    ProfessorController.getProfessorsCourseAndStudentCount
  );
  router.post(
    '/create',
    upload.single('image'),
    ProfessorController.createProfessor
  );
  router.put(
    '/update/:id',
    upload.single('image'),
    ProfessorController.updateProfessor
  );
  router.put('/update-status/:id', ProfessorController.updateProfessorStatus);
  router.delete('/delete/:id', ProfessorController.deleteProfessor);
  router.get('/get-all-courses', ProfessorController.getAllProfessorsCourses);
  return router;
};
