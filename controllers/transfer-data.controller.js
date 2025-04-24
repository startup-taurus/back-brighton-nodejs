const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
const catchControllerAsync = require('../utils/catch-controller-async');

let _transferDataService = null;

module.exports = class TransferDataController extends BaseController {
  constructor({ TransferDataService }) {
    super(TransferDataService);
    _transferDataService = TransferDataService;
  }

  getAllTransferData = catchControllerAsync(async (req, res) => {
    const result = await _transferDataService.getAllTransferData({
      ...req.query,
    });
    return appResponse(res, result);
  });
  getTransferData = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _transferDataService.getTransferData(id);
    return appResponse(res, result);
  });
  getPendingTransferData = catchControllerAsync(async (req, res) => {
    const result = await _transferDataService.getPendingTransferData();
    return appResponse(res, result);
  });

  createTransferData = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const result = await _transferDataService.createTransferData(body);
    return appResponse(res, result);
  });

  approveTransfer = catchControllerAsync(async (req, res) => {
    const { transferDataId } = req.params; 
    const result = await _transferDataService.approveTransfer(transferDataId);
    return appResponse(res, result);
  });

  rejectTransfer = catchControllerAsync(async (req, res) => {
    const { transferDataId } = req.params; 
    const result = await _transferDataService.rejectTransfer(transferDataId);
    return appResponse(res, result);
  });

  updateTransferData = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const { id } = req.params;
    const result = await _transferDataService.updateTransferData(id, body);
    return appResponse(res, result);
  });
  updateTransferStatus = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const { id } = req.params;
    const result = await _transferDataService.updateTransferStatus(id, body);
    return appResponse(res, result);
  });
  deleteTransferData = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _transferDataService.deleteTransferData(id);
    return appResponse(res, result);
  });
};
