const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
let _registeredStudentService = null;
module.exports = class RegisteredStudentController extends BaseController {
  constructor({ RegisteredStudentService }) {
    super(RegisteredStudentService);
    _registeredStudentService = RegisteredStudentService;
  }
  getAllRegisteredStudents = catchControllerAsync(async (req, res) => {
    const result = await _registeredStudentService.getAllRegisteredStudents({
      ...req.query,
    });
    return appResponse(res, result);
  });

  getStudent = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _registeredStudentService.getStudent(id);
    return appResponse(res, result);
  });

  createStudent = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const result = await _registeredStudentService.createStudent(body);
    return appResponse(res, result);
  });

  updateStudent = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const { id } = req.params;
    const result = await _registeredStudentService.updateStudent(id, body);
    return appResponse(res, result);
  });

  deleteStudent = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _registeredStudentService.deleteStudent(id);
    return appResponse(res, result);
  });
};
