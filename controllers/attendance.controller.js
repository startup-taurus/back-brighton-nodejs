const BaseController = require('./base.controller');
const catchControllerAsync = require('../utils/catch-controller-async');
const { appResponse } = require('../utils/app-response');
let _attendanceService = null;
module.exports = class AttendanceController extends BaseController {
  constructor({ AttendanceService }) {
    super(AttendanceService);
    _attendanceService = AttendanceService;
  }

  getAttendanceByCourse = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _attendanceService.getAttendanceByCourse(id);
    return appResponse(res, result);
  });

  getAttendanceByCourseAndStudent = catchControllerAsync(async (req, res) => {
    const { courseId, studentId } = req.params;
    const result = await _attendanceService.getAttendanceByCourseAndStudent(
      courseId,
      studentId
    );
    return appResponse(res, result);
  });

  createAttendance = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const result = await _attendanceService.createAttendance(body);
    return appResponse(res, result);
  });
};
