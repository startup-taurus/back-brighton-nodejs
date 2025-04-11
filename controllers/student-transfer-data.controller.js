const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
const AppError = require('../utils/app-error');

let _studentTransferDataService = null;

module.exports = class StudentTransferDataController extends BaseController {
  constructor({ StudentTransferDataService }) {
    super(StudentTransferDataService);
    _studentTransferDataService = StudentTransferDataService;
  }

  // Método para obtener todas las solicitudes de transferencia pendientes
  getPendingTransfers = catchControllerAsync(async (req, res) => {
    const result = await _studentTransferDataService.getPendingTransfers(
      req.query
    );
    return appResponse(res, result);
  });

  // Método para obtener las solicitudes de transferencia de un estudiante específico
  getStudentTransfers = catchControllerAsync(async (req, res) => {
    const { studentId } = req.params;

    if (!studentId) {
      throw new AppError('El ID del estudiante es requerido', 400);
    }

    const result = await _studentTransferDataService.getStudentTransfers(
      studentId
    );

    // Filtrar solo las transferencias con status_level_change = 'pending'
    if (result.data && Array.isArray(result.data)) {
      result.data = result.data.filter(
        (transfer) => transfer.status_level_change === 'pending'
      );
    }

    return appResponse(res, result);
  });

  // Método para aprobar una solicitud de transferencia
  approveTransfer = catchControllerAsync(async (req, res) => {
    const { transferId } = req.params;
    const result = await _studentTransferDataService.approveTransfer(
      transferId
    );
    return appResponse(res, result);
  });

  // Método para rechazar una solicitud de transferencia
  rejectTransfer = catchControllerAsync(async (req, res) => {
    const { transferId } = req.params;
    const result = await _studentTransferDataService.rejectTransfer(transferId);
    return appResponse(res, result);
  });
};
