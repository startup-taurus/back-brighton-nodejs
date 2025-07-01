const { Router } = require('express');

module.exports = function ({ TransferDataController }) {
  const router = Router();
  
  router.get('/get-all', TransferDataController.getAllTransferData);
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
