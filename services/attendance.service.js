const BaseService = require('./base.service');
const catchServiceAsync = require('../utils/catch-service-async');
const { validateParameters, countAttendance } = require('../utils/utils');

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

  getAttendanceByCourseAndStudent = catchServiceAsync(
    async (courseId, studentId) => {
      console.log('Here');

      const attendanceRecords = await _attendance.findAll({
        where: { student_id: studentId },
        include: [
          {
            model: _courseSchedule,
            as: 'course_schedule',
            where: { course_id: courseId },
          },
        ],
        raw: true,
      });

      const totalDaysOfClasses = await _courseSchedule.count({
        where: { course_id: courseId },
      });

      const attendanceTotal = countAttendance(attendanceRecords);
      const attendancePercentage = Number(
        (attendanceTotal / totalDaysOfClasses) * 100
      ).toFixed(2);

      console.log(attendancePercentage);

      return {
        data: {
          attendancePercentage,
        },
      };
    }
  );

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
      currentAttendance = await _attendance.update({
        status,
      });
    }

    return { data: currentAttendance };
  });
};
