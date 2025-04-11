const { Router } = require('express');

module.exports = function ({ StudentTransferDataController }) {
  const router = Router();

  // Ruta para obtener todas las solicitudes de transferencia pendientes
  router.get('/pending', StudentTransferDataController.getPendingTransfers);

  // Ruta para obtener las solicitudes de transferencia de un estudiante específico
  router.get(
    '/student/:studentId',
    StudentTransferDataController.getStudentTransfers
  );

  // Ruta para aprobar una solicitud de transferencia
  router.put(
    '/approve/:transferId',
    StudentTransferDataController.approveTransfer
  );

  // Ruta para rechazar una solicitud de transferencia
  router.put(
    '/reject/:transferId',
    StudentTransferDataController.rejectTransfer
  );

  return router;
};
