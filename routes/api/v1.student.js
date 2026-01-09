const { Router } = require('express');
const { requirePermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions');
module.exports = function ({ StudentController, AuthMiddleware }) {
  const router = Router();
  router.get(
    '/get-all',
    [
      AuthMiddleware,
      requirePermissions(PERMISSIONS.VIEW_STUDENTS),
    ],
    StudentController.getAllStudents
  );
  router.get(
    '/get-one/:id',
    [AuthMiddleware, requirePermissions(PERMISSIONS.VIEW_STUDENTS)],
    StudentController.getStudent
  );
  router.get(
    '/best-students',
    [AuthMiddleware, requirePermissions(PERMISSIONS.VIEW_STUDENTS)],
    StudentController.getBestStudents
  );
  router.post(
    '/create',
    [AuthMiddleware, requirePermissions(PERMISSIONS.CREATE_STUDENT)],
    StudentController.createStudent
  );
  router.post(
    '/transfer-and-progress',
    [AuthMiddleware, requirePermissions(PERMISSIONS.APPROVE_TRANSFER)],
    StudentController.transferAndProgressStudents
  );
  router.put(
    '/update/:id',
    [AuthMiddleware, requirePermissions(PERMISSIONS.EDIT_STUDENT)],
    StudentController.updateStudent
  );
  router.put(
    '/update-status/:id',
    [AuthMiddleware, requirePermissions(PERMISSIONS.TOGGLE_STUDENT_STATUS)],
    StudentController.updateStudentStatus
  );
  router.delete(
    '/delete/:id',
    [AuthMiddleware, requirePermissions(PERMISSIONS.DELETE_STUDENT)],
    StudentController.deleteStudent
  );
  return router;
};
