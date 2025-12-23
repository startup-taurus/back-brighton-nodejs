const { Router } = require('express');
const { requirePermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions')
module.exports = function ({ TransferDataController, AuthMiddleware }) {
  const router = Router();
  
  router.get('/get-all', AuthMiddleware,
    requirePermissions(PERMISSIONS.VIEW_TRANSFER_STUDENTS),TransferDataController.getAllTransferData);
  router.get('/get-one/:id', TransferDataController.getTransferData);
  router.get('/get-pending', TransferDataController.getPendingTransferData);
  router.get('/get-approved', TransferDataController.getApprovedTransfers);
  router.post('/create', TransferDataController.createTransferData);
  router.put(
    '/approve/:transferDataId',
    TransferDataController.approveTransfer
  );
  router.put('/reject/:transferDataId', TransferDataController.rejectTransfer);
  router.put('/update/:id', TransferDataController.updateTransferData);
  router.put('/update-status/:id', TransferDataController.updateTransferStatus);
  router.delete('/delete/:id', TransferDataController.deleteTransferData);
  return router;
};
