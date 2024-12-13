const BaseService = require('./base.service');
const catchServiceAsync = require('../utils/catch-service-async');
const { validateParameters } = require('../utils/utils');
const { Op, fn, col, Sequelize } = require('sequelize');
const moment = require('moment');
const AppError = require('../utils/app-error');
let _user = null;
let _course = null;
let _student = null;
let _attendance = null;
let _courseSchedule = null;
module.exports = class AttendanceService extends BaseService {
  constructor({ Attendance, User, CourseSchedule, Course, Student }) {
    super(Attendance);
    _user = User.User;
    _course = Course.Course;
    _student = Student.Student;
    _attendance = Attendance.Attendance;
    _courseSchedule = CourseSchedule.CourseSchedule;
  }

  getAttendanceByCourse = catchServiceAsync(async (courseId) => {
    const attendanceRecords = await _attendance.findAll({
      include: [
        {
          model: _courseSchedule,
          as: 'course_schedule',
          where: { course_id: courseId },
        },
      ],
    });

    return { data: attendanceRecords ?? [] };
  });

  createAttendance = catchServiceAsync(async (body) => {
    const { course_schedule_id, student_id, status } = body;

    validateParameters({
      course_schedule_id,
      student_id,
      status,
    });

    const attendance = await _attendance.findOne({
      where: {
        course_schedule_id,
        student_id,
      },
    });

    let currentAttendance;

    if (!attendance) {
      currentAttendance = await _attendance.create({
        course_schedule_id,
        student_id,
        status,
      });
    } else {
      currentAttendance = await attendance.update({
        status,
      });
    }

    return { data: currentAttendance };
  });
};
