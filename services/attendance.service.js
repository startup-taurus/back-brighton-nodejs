const BaseService = require('./base.service');
const catchServiceAsync = require('../utils/catch-service-async');
const { validateParameters, countAttendance } = require('../utils/utils');

let _user = null;
let _course = null;
let _student = null;
let _attendance = null;
let _courseSchedule = null;
let _courseService = null;
let _courseScheduleService = null;
module.exports = class AttendanceService extends BaseService {
  constructor({
    Attendance,
    User,
    CourseSchedule,
    Course,
    Student,
    CourseService,
    CourseScheduleService,
  }) {
    super(Attendance);
    _user = User.User;
    _course = Course.Course;
    _student = Student.Student;
    _attendance = Attendance.Attendance;
    _courseSchedule = CourseSchedule.CourseSchedule;
    _courseService = CourseService;
    _courseScheduleService = CourseScheduleService;
  }

  initializeAttendanceStructure = (
    courseSchedule,
    students,
    attendanceDate
  ) => {
    courseSchedule?.forEach((courseScheduleItem) => {
      attendanceDate[courseScheduleItem.id] = {};
      students?.forEach((student) => {
        attendanceDate[courseScheduleItem.id][student.id] = '';
      });
    });
  };

  buildAttendanceStructure = (courseSchedule, students, studentsAttendance) => {
    let attendanceDate = {};
    this.initializeAttendanceStructure(
      courseSchedule,
      students,
      attendanceDate
    );

    studentsAttendance?.forEach((studentAttendance) => {
      if (attendanceDate[studentAttendance?.course_schedule_id]) {
        attendanceDate[studentAttendance.course_schedule_id][
          studentAttendance?.student_id
        ] = studentAttendance?.status;
      }
    });

    return attendanceDate;
  };

  getAttendanceByCourseId = catchServiceAsync(async (courseId) => {
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

  getAttendanceByCourse = catchServiceAsync(async (courseId) => {
    const courseAttendance = await this.getAttendanceByCourseId(courseId);
    const students = await _courseService.getCourseWithStudents(courseId);
    const courseSchedule = await _courseScheduleService.getCourseScheduleDates(
      courseId
    );

    const attendance = this.buildAttendanceStructure(
      courseSchedule?.data,
      students?.data?.students,
      courseAttendance?.data
    );

    return { data: attendance ?? [] };
  });

  getAttendanceByCourseAndStudent = catchServiceAsync(
    async (courseId, studentId) => {
      const attendanceRecords = await _attendance.findAll({
        where: { student_id: studentId },
        include: [
          {
            model: _courseSchedule,
            as: 'course_schedule',
            where: { course_id: courseId },
            order: [['scheduled_date', 'ASC']],
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
