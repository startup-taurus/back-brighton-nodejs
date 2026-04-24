const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const catchServiceAsync = require('../utils/catch-service-async');
const { COURSE_TYPES, ATTENDANCE_THRESHOLDS } = require('../utils/constants');
const { validateParameters, countAttendance } = require('../utils/utils');

let _user = null;
let _course = null;
let _student = null;
let _attendance = null;
let _courseSchedule = null;
let _courseService = null;
let _courseScheduleService = null;
let _courseStudent = null;

module.exports = class AttendanceService extends BaseService {
  constructor({
    Attendance,
    User,
    CourseSchedule,
    Course,
    Student,
    CourseService,
    CourseScheduleService,
    CourseStudent,
  }) {
    super(Attendance);
    _user = User.User;
    _course = Course.Course;
    _student = Student.Student;
    _attendance = Attendance.Attendance;
    _courseSchedule = CourseSchedule.CourseSchedule;
    _courseService = CourseService;
    _courseScheduleService = CourseScheduleService;
    _courseStudent = CourseStudent.CourseStudent;
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
    const course = await _course.findByPk(courseId, {
      attributes: ['course_type']
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (course.course_type === COURSE_TYPES.PRIVATE || course.course_type === COURSE_TYPES.PRIVATE_ONLINE) {
      throw new AppError('For private classes, use the private_class_hours endpoint', 400);
    } else {
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
    }
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

  getConsecutiveAbsencesReport = catchServiceAsync(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasLastClassDate = Boolean(_course.rawAttributes?.last_class_date);

    const attendanceRecords = await _attendance.findAll({
      include: [
        {
          model: _courseSchedule,
          as: 'course_schedule',
          include: [
            {
              model: _course,
              as: 'course',
              where: {
                status: 'active'
              },
              attributes: ['id', 'course_name', 'course_number', ...(hasLastClassDate ? ['last_class_date'] : [])],
              required: true
            }
          ],
          attributes: ['id', 'scheduled_date', 'course_id'],
          required: true
        },
        {
          model: _student,
          as: 'student',
          where: {
            status: 'active'
          },
          include: [
            {
              model: _user,
              as: 'user',
              attributes: ['name']
            },
            {
              model: _courseStudent,
              as: 'coursesStudent',
              where: {
                is_retired: false
              },
              attributes: ['course_id', 'is_retired'],
              required: true,
            }
          ],
          attributes: ['id', 'user_id', 'status']
        }
      ],
      order: [
        ['student_id', 'ASC'],
        [{ model: _courseSchedule, as: 'course_schedule' }, 'course_id', 'ASC'],
        [{ model: _courseSchedule, as: 'course_schedule' }, 'scheduled_date', 'DESC']
      ]
    });

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return { data: [] };
    }

    const studentCourseAttendances = {};

    attendanceRecords.forEach(record => {
      const courseSchedule = record.course_schedule;
      const course = courseSchedule?.course;
      const student = record.student;

      if (!courseSchedule || !course || !student?.user) {
        return;
      }

      if (hasLastClassDate && course.last_class_date) {
        const courseLastClassDate = new Date(course.last_class_date);
        if (courseLastClassDate < today) {
          return;
        }
      }

      const studentId = record.student_id;
      const courseId = courseSchedule.course_id;

      const hasActiveEnrollmentInCourse = Array.isArray(student.coursesStudent)
        && student.coursesStudent.some(courseStudent =>
          !courseStudent.is_retired && Number(courseStudent.course_id) === Number(courseId)
        );

      if (!hasActiveEnrollmentInCourse) {
        return;
      }

      const key = `${studentId}-${courseId}`;

      if (!studentCourseAttendances[key]) {
        studentCourseAttendances[key] = {
          studentId,
          studentName: student.user.name,
          courseId,
          courseCode: course.course_number,
          courseName: course.course_name,
          attendances: []
        };
      }

      studentCourseAttendances[key].attendances.push({
        status: record.status,
        scheduledDate: new Date(courseSchedule.scheduled_date),
      });
    });

    const consecutiveAbsencesReport = [];

    Object.values(studentCourseAttendances).forEach(studentCourse => {
      studentCourse.attendances.sort((a, b) => b.scheduledDate - a.scheduledDate);

      let currentStreak = 0;

      for (const attendance of studentCourse.attendances) {
        if (attendance.status === 'absent') {
          currentStreak++;
          continue;
        }

        break;
      }

      if (currentStreak >= ATTENDANCE_THRESHOLDS.MIN_CONSECUTIVE_ABSENCES) {
        consecutiveAbsencesReport.push({
          course_code: studentCourse.courseCode,
          course_name: studentCourse.courseName,
          student_name: studentCourse.studentName,
          consecutive_absences: currentStreak
        });
      }
    });

    return { data: consecutiveAbsencesReport };
  });
};
