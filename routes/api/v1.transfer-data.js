const { Router } = require('express');
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants')
module.exports = function ({ TransferDataController, AuthMiddleware }) {
  const router = Router();
  
  router.get('/get-all', AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN, USER_TYPES.RECEPTIONIST),TransferDataController.getAllTransferData);
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
