const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
let _syllabusService = null;
module.exports = class SyllabusController extends BaseController {
  constructor({ SyllabusService }) {
    super(SyllabusService);
    _syllabusService = SyllabusService;
  }
  getAllSyllabus = catchControllerAsync(async (req, res) => {
    const { page, limit } = req.query;
    const result = await _syllabusService.getAllSyllabus(page, limit);
    return appResponse(res, result);
  });

  getSyllabusById = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _syllabusService.getSyllabusById(id);
    return appResponse(res, result);
  });

  getIdSyllabus = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _syllabusService.getSyllabusById(id);
    return appResponse(res, result);
  });

  createSyllabus = catchControllerAsync(async (req, res) => {
    const result = await _syllabusService.createSyllabus(req.body);
    return appResponse(res, result);
  });

  createAssignmentGradingItem = catchControllerAsync(async (req, res) => {
    const result = await _syllabusService.createAssignmentGradingItem(req.body);
    return appResponse(res, result);
  });

  updateAssignmentGradingItem = catchControllerAsync(async (req, res) => {
    const result = await _syllabusService.updateAssignmentGradingItem(req.body);
    return appResponse(res, result);
  });

  updateSyllabus = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _syllabusService.updateSyllabus(id, req.body);
    return appResponse(res, result);
  });
};
