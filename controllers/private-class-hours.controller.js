const BaseController = require('./base.controller');
const catchControllerAsync = require('../utils/catch-controller-async');
const { appResponse } = require('../utils/app-response');
let _privateClassHoursService = null;

module.exports = class PrivateClassHoursController extends BaseController {
  constructor({ PrivateClassHoursService }) {
    super(PrivateClassHoursService);
    _privateClassHoursService = PrivateClassHoursService;
  }

  getPrivateClassesByCourse = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _privateClassHoursService.getPrivateClassesByCourse(id);
    return appResponse(res, result);
  });

  getPrivateClassesByStudent = catchControllerAsync(async (req, res) => {
    const { studentId } = req.params;
    const result = await _privateClassHoursService.getPrivateClassesByStudent(studentId);
    return appResponse(res, result);
  });

  createPrivateClass = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const result = await _privateClassHoursService.createPrivateClass(body);
    return appResponse(res, result);
  });

  updatePrivateClass = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const professorId = req.user?.id; 

    const result = await _privateClassHoursService.updatePrivateClass(id, updateData, professorId);
    return appResponse(res, result);
  });

  deletePrivateClass = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const professorId = req.user?.id; 

    const result = await _privateClassHoursService.deletePrivateClass(id, professorId);
    return appResponse(res, result);
  });

  createMultiplePrivateClasses = catchControllerAsync(async (req, res) => {
    const { id } = req.params; 
    const { entries } = req.body;
    const professorId = req.user?.id; 

    const result = await _privateClassHoursService.createMultiplePrivateClasses(id, entries, professorId);
    return appResponse(res, result);
  });

  getPrivateClassStats = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _privateClassHoursService.getPrivateClassStats(id);
    return appResponse(res, result);
  });
};