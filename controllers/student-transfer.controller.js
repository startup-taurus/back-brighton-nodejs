const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');

let _studentTransferService = null;

module.exports = class StudentTransferController extends BaseController {
  constructor({ StudentTransferService }) {
    super(StudentTransferService);
    _studentTransferService = StudentTransferService;
  }

  getAllStudentTransfers = catchControllerAsync(async (req, res) => {
    const result = await _studentTransferService.getAllStudentTransfers({
      ...req.query,
    });
    return appResponse(res, result);
  });

  getStudentTransfer = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _studentTransferService.getStudentTransfer(id);
    return appResponse(res, result);
  });

  getStudentTransfersByTransferDataId = catchControllerAsync(
    async (req, res) => {
      const { transfer_data_id } = req.params;
      const result =
        await _studentTransferService.getStudentTransfersByTransferDataId(
          transfer_data_id
        );
      return appResponse(res, result);
    }
  );

  createStudentTransfer = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const result = await _studentTransferService.createStudentTransfer(body);
    return appResponse(res, result);
  });

  deleteStudentTransfer = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _studentTransferService.deleteStudentTransfer(id);
    return appResponse(res, result);
  });

  deleteStudentFromTransfer = catchControllerAsync(async (req, res) => {
    const { student_id, transfer_data_id } = req.params;
    const result = await _studentTransferService.deleteStudentFromTransfer(
      student_id,
      transfer_data_id
    );
    return appResponse(res, result);
  });
};
