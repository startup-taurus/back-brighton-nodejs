const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
let _studentService = null;
module.exports = class StudentController extends BaseController {
  constructor({ StudentService }) {
    super(StudentService);
    _studentService = StudentService;
  }
  getAllStudents = async (req, res) => {
    const result = await _studentService.getAllStudents({ ...req.query });
    return appResponse(res, result);
  };

  getStudent = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _studentService.getStudent(id);
    return appResponse(res, result);
  });

  createStudent = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const result = await _studentService.createStudent(body);
    return appResponse(res, result);
  });

  updateStudent = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const { id } = req.params;
    const result = await _studentService.updateStudent(id, body);
    return appResponse(res, result);
  });

  updateStudentStatus = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const { id } = req.params;
    const result = await _studentService.updateStudentStatus(id, body);
    return appResponse(res, result);
  });

  deleteStudent = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _studentService.deleteStudent(id);
    return appResponse(res, result);
  });

  getBestStudents = catchControllerAsync(async (req, res) => {
    const { course_id, level_id, limit = 10 } = req.query;
    const result = await _studentService.getBestStudents({
      course_id,
      level_id,
      limit: parseInt(limit),
    });
    return appResponse(res, result);
  });

  transferAndProgressStudents = catchControllerAsync(async (req, res) => {
    const { studentIds, courseId, levelId } = req.body;
    const result = await _studentService.transferAndProgressStudents(studentIds, courseId, levelId);
    return appResponse(res, result);
  });
};
