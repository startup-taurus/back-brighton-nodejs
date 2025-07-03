const { Router } = require('express');
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants')
module.exports = function ({ StudentTransferController, AuthMiddleware }) {
  const router = Router();
  router.get('/get-all', [AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN)], StudentTransferController.getAllStudentTransfers);
  router.get('/get-one/:id',[AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN)], StudentTransferController.getStudentTransfer);
  router.get(
    '/by-transfer/:transfer_data_id', [AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST)],
    StudentTransferController.getStudentTransfersByTransferDataId
  );
  router.post('/create',  StudentTransferController.createStudentTransfer);
  router.delete('/delete/:id', StudentTransferController.deleteStudentTransfer);
  router.delete(
    '/delete-student/:student_id/:transfer_data_id',
    StudentTransferController.deleteStudentFromTransfer
  );
  return router;
};
