const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');

let _levelService = null;

module.exports = class LevelController extends BaseController {
  constructor({ LevelService }) {
    super(LevelService);
    _levelService = LevelService;
  }

  getAllLevels = catchControllerAsync(async (req, res) => {
    const result = await _levelService.getAllLevels({ ...req.query });
    return appResponse(res, result);
  });

  getLevel = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _levelService.getLevel(id);
    return appResponse(res, result);
  });

  createLevel = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const result = await _levelService.createLevel(body);
    return appResponse(res, result);
  });

  updateLevel = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const { id } = req.params;
    const result = await _levelService.updateLevel(id, body);
    return appResponse(res, result);
  });

  deleteLevel = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _levelService.deleteLevel(id);
    return appResponse(res, result);
  });
};
