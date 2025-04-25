const { Router } = require('express');

module.exports = function ({ StudentTransferController }) {
  const router = Router();
  router.get('/get-all', StudentTransferController.getAllStudentTransfers);
  router.get('/get-one/:id', StudentTransferController.getStudentTransfer);
  router.get(
    '/by-transfer/:transfer_data_id',
    StudentTransferController.getStudentTransfersByTransferDataId
  );
  router.post('/create', StudentTransferController.createStudentTransfer);
  router.delete('/delete/:id', StudentTransferController.deleteStudentTransfer);
  router.delete(
    '/delete-student/:student_id/:transfer_data_id',
    StudentTransferController.deleteStudentFromTransfer
  );
  return router;
};
