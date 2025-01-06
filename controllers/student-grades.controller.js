const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
let _studentGradesService = null;

module.exports = class StudentGradesController extends BaseController {
  constructor({ StudentGradesService }) {
    super(StudentGradesService);
    _studentGradesService = StudentGradesService;
  }

  getGradesByCourse = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _studentGradesService.getGradesByCourse(id);
    return appResponse(res, result);
  });

  getGradesByCourseAndStudent = catchControllerAsync(async (req, res) => {
    const { courseId, studentId } = req.params;
    const result = await _studentGradesService.getGradesByCourseAndStudent(
      courseId,
      studentId
    );
    return appResponse(res, result);
  });

  createStudentGrade = async (req, res) => {
    const body = req.body;
    const result = await _studentGradesService.createStudentGrade(body);
    return appResponse(res, result);
  };
};
