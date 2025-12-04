const { Router } = require('express');
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants')
module.exports = function ({ StudentController, AuthMiddleware }) {
  const router = Router();
  router.get(
    '/get-all',
    [
      AuthMiddleware,
      requireRoles(
        USER_TYPES.COORDINATOR,
        USER_TYPES.ADMIN,
        USER_TYPES.RECEPTIONIST,
        USER_TYPES.FINANCIAL,
        USER_TYPES.PROFESSOR
      ),
    ],
    StudentController.getAllStudents
  );
  router.get(
    '/get-one/:id',
    [AuthMiddleware,
      requireRoles(
        USER_TYPES.COORDINATOR,
        USER_TYPES.ADMIN,
        USER_TYPES.RECEPTIONIST,
        USER_TYPES.FINANCIAL,
        USER_TYPES.PROFESSOR
      )
    ],
    StudentController.getStudent
  );
  router.get(
    '/best-students',
    [AuthMiddleware, requireRoles(USER_TYPES.ADMIN, USER_TYPES.COORDINATOR)],
    StudentController.getBestStudents
  );
  router.post(
    '/create',
    [AuthMiddleware, requireRoles(USER_TYPES.ADMIN, USER_TYPES.COORDINATOR)],
    StudentController.createStudent
  );
  router.post(
    '/transfer-and-progress',
    [AuthMiddleware, requireRoles(USER_TYPES.ADMIN, USER_TYPES.COORDINATOR)],
    StudentController.transferAndProgressStudents
  );
  router.put(
    '/update/:id',
    [AuthMiddleware, requireRoles(USER_TYPES.ADMIN, USER_TYPES.COORDINATOR)],
    StudentController.updateStudent
  );
  router.put(
    '/update-status/:id',
    [AuthMiddleware, requireRoles(USER_TYPES.ADMIN, USER_TYPES.COORDINATOR)],
    StudentController.updateStudentStatus
  );
  router.delete(
    '/delete/:id',
    [AuthMiddleware, requireRoles(USER_TYPES.ADMIN)],
    StudentController.deleteStudent
  );
  return router;
};
