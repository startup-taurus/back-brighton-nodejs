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
    const attendanceRecords = await _attendance.findAll({
      include: [
        {
          model: _courseSchedule,
          as: 'course_schedule',
          include: [
            {
              model: _course,
              as: 'course',
              attributes: ['id', 'course_name', 'course_number']
            }
          ],
          attributes: ['id', 'scheduled_date', 'course_id']
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
              required: true
            }
          ],
          attributes: ['id', 'user_id', 'status']
        }
      ],
      where: {
        status: 'absent'
      },
      order: [['student_id', 'ASC'], [{ model: _courseSchedule, as: 'course_schedule' }, 'scheduled_date', 'ASC']]
    });
    
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return { data: [] };
    }
    
    const studentCourseAbsences = {};
    
    attendanceRecords.forEach(record => {
      const studentId = record.student_id;
      const courseId = record.course_schedule.course_id;
      const courseCode = record.course_schedule.course.course_number;
      const courseName = record.course_schedule.course.course_name;
      const studentName = record.student.user.name;
      const absenceDate = new Date(record.course_schedule.scheduled_date);
      
      const key = `${studentId}-${courseId}`;
      
      if (!studentCourseAbsences[key]) {
        studentCourseAbsences[key] = {
          studentId,
          studentName,
          courseId,
          courseCode,
          courseName,
          absences: []
        };
      }
      
      studentCourseAbsences[key].absences.push(absenceDate);
    });
    
    const consecutiveAbsencesReport = [];
    
    Object.values(studentCourseAbsences).forEach(studentCourse => {
      studentCourse.absences.sort((a, b) => a - b);
      
      let maxConsecutive = 0;
      let currentConsecutive = 1;
      
      if (studentCourse.absences.length === 1) {
        maxConsecutive = 1;
      } else {
        for (let i = 1; i < studentCourse.absences.length; i++) {
          const prevDate = studentCourse.absences[i - 1];
          const currentDate = studentCourse.absences[i];
          
          const diffTime = Math.abs(currentDate - prevDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 7) {
            currentConsecutive++;
          } else {
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            currentConsecutive = 1;
          }
        }
        

        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      }
      
      if (maxConsecutive >= ATTENDANCE_THRESHOLDS.MIN_CONSECUTIVE_ABSENCES) {
        consecutiveAbsencesReport.push({
          course_code: studentCourse.courseCode,
          course_name: studentCourse.courseName,
          student_name: studentCourse.studentName,
          consecutive_absences: maxConsecutive
        });
      }
    });
    
    return { data: consecutiveAbsencesReport };
  });
};
