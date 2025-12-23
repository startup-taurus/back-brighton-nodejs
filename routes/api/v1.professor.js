const { Router } = require('express');
const { upload } = require('../../utils/upload');
const { requirePermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions');

module.exports = function ({ ProfessorController, AuthMiddleware }) {
  const router = Router();
  router.get('/get-all', [
      AuthMiddleware,
      requirePermissions(PERMISSIONS.VIEW_TEACHERS),
    ],ProfessorController.getAllProfessors);
  router.get('/get-one/:id', ProfessorController.getProfessor);
  router.get('/:id/courses',  ProfessorController.getProfessorCourses);
  router.get('/:id/courses/calendar',  ProfessorController.getProfessorActiveCoursesForCalendar);
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
  router.put(
    '/update-status/:id',
    [AuthMiddleware, requirePermissions(PERMISSIONS.TOGGLE_TEACHER_STATUS)],
    ProfessorController.updateProfessorStatus
  );
  router.delete('/delete/:id', ProfessorController.deleteProfessor);
  router.get('/get-all-courses', ProfessorController.getAllProfessorsCourses);
  return router;
};
