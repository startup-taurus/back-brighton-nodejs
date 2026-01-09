const { Router } = require('express');
const { requirePermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions')
module.exports = function ({ StudentTransferController, AuthMiddleware }) {
  const router = Router();
  router.get('/get-all', [AuthMiddleware,
    requirePermissions(PERMISSIONS.VIEW_TRANSFER_STUDENTS)], StudentTransferController.getAllStudentTransfers);
  router.get('/get-one/:id',[AuthMiddleware,
    requirePermissions(PERMISSIONS.VIEW_TRANSFER_STUDENTS)], StudentTransferController.getStudentTransfer);
  router.get(
    '/by-transfer/:transfer_data_id', [AuthMiddleware,
    requirePermissions(PERMISSIONS.VIEW_TRANSFER_STUDENTS)],
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
