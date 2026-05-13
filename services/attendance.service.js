const BaseService = require('./base.service');
const { Op } = require('sequelize');
const AppError = require('../utils/app-error');
const catchServiceAsync = require('../utils/catch-service-async');
const { COURSE_TYPES, ATTENDANCE_THRESHOLDS } = require('../utils/constants');
const { validateParameters, countAttendance } = require('../utils/utils');

const ALLOWED_ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'recovered'];

let _user = null;
let _course = null;
let _student = null;
let _attendance = null;
let _courseSchedule = null;
let _courseService = null;
let _courseScheduleService = null;
let _courseStudent = null;
let _professor = null;

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
    Professor,
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
    _professor = Professor.Professor;
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

    if (!ALLOWED_ATTENDANCE_STATUSES.includes(status)) {
      throw new AppError(
        `Invalid attendance status: "${status}". Allowed values: ${ALLOWED_ATTENDANCE_STATUSES.join(', ')}`,
        400
      );
    }

    const sequelize = _attendance.sequelize;

    const currentAttendance = await sequelize.transaction(async (transaction) => {
      const [record, created] = await _attendance.findOrCreate({
        where: { course_schedule_id, student_id },
        defaults: { course_schedule_id, student_id, status },
        transaction,
      });

      if (!created && record.status !== status) {
        await record.update({ status }, { transaction });
      }

      return record;
    });

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
              attributes: ['id', 'course_name', 'course_number', 'status', ...(hasLastClassDate ? ['last_class_date'] : [])],
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

    const involvedCourseIds = [
      ...new Set(
        attendanceRecords
          .map(record => record?.course_schedule?.course_id)
          .filter(Boolean)
      ),
    ];

    const lastScheduleRows = involvedCourseIds.length
      ? await _courseSchedule.findAll({
        attributes: [
          'course_id',
          [
            _courseSchedule.sequelize.fn(
              'MAX',
              _courseSchedule.sequelize.col('scheduled_date')
            ),
            'last_scheduled_date',
          ],
        ],
        where: {
          course_id: {
            [Op.in]: involvedCourseIds,
          },
        },
        group: ['course_id'],
        raw: true,
      })
      : [];

    const latestScheduleDateByCourse = new Map(
      lastScheduleRows.map(row => [
        Number(row.course_id),
        row.last_scheduled_date ? new Date(row.last_scheduled_date) : null,
      ])
    );

    const studentCourseAttendances = {};

    attendanceRecords.forEach(record => {
      const courseSchedule = record.course_schedule;
      const course = courseSchedule?.course;
      const student = record.student;

      if (!courseSchedule || !course || !student?.user) {
        return;
      }

      const normalizedCourseStatus = String(course.status || '').trim().toLowerCase();
      if (normalizedCourseStatus !== 'active') {
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

      const latestScheduleDate = latestScheduleDateByCourse.get(Number(courseId));
      if (latestScheduleDate) {
        latestScheduleDate.setHours(0, 0, 0, 0);
        if (latestScheduleDate < today) {
          return;
        }
      }

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
          course_id: studentCourse.courseId,
          course_code: studentCourse.courseCode,
          course_name: studentCourse.courseName,
          student_name: studentCourse.studentName,
          consecutive_absences: currentStreak
        });
      }
    });

    return { data: consecutiveAbsencesReport };
  });

  getUntakenAttendanceReport = catchServiceAsync(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ongoingCourses = await _courseSchedule.findAll({
      where: { scheduled_date: { [Op.gte]: today } },
      attributes: ['course_id'],
      group: ['course_id'],
      raw: true,
    });
    const ongoingCourseIds = ongoingCourses.map((row) => Number(row.course_id));

    if (ongoingCourseIds.length === 0) {
      return { data: [] };
    }

    const schedules = await _courseSchedule.findAll({
      where: {
        scheduled_date: { [Op.lt]: today },
        course_id: { [Op.in]: ongoingCourseIds },
      },
      attributes: ['id', 'course_id', 'scheduled_date'],
      include: [
        {
          model: _course,
          as: 'course',
          required: true,
          where: {
            status: 'active',
            course_type: {
              [Op.notIn]: [COURSE_TYPES.PRIVATE, COURSE_TYPES.PRIVATE_ONLINE],
            },
          },
          attributes: ['id', 'course_name', 'course_number', 'professor_id'],
          include: [
            {
              model: _professor,
              as: 'professor',
              required: true,
              attributes: ['id', 'user_id'],
              include: [
                {
                  model: _user,
                  as: 'user',
                  required: true,
                  attributes: ['name'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!schedules || schedules.length === 0) {
      return { data: [] };
    }

    const scheduleIds = schedules.map((schedule) => schedule.id);
    const courseIds = [...new Set(schedules.map((schedule) => schedule.course_id))];

    const attendances = await _attendance.findAll({
      where: { course_schedule_id: { [Op.in]: scheduleIds } },
      attributes: ['course_schedule_id', 'student_id', 'status'],
      raw: true,
    });

    const enrollments = await _courseStudent.findAll({
      where: {
        course_id: { [Op.in]: courseIds },
        is_retired: false,
      },
      attributes: ['course_id', 'student_id'],
      include: [
        {
          model: _student,
          required: true,
          where: { status: 'active' },
          attributes: ['id'],
        },
      ],
    });

    const activeStudentsByCourse = new Map();
    enrollments.forEach((enrollment) => {
      const courseId = Number(enrollment.course_id);
      if (!activeStudentsByCourse.has(courseId)) {
        activeStudentsByCourse.set(courseId, new Set());
      }
      activeStudentsByCourse.get(courseId).add(Number(enrollment.student_id));
    });

    const markedByScheduleAndStudent = new Map();
    attendances.forEach((attendance) => {
      const status = String(attendance.status || '').trim();
      if (status === '') return;
      const scheduleKey = Number(attendance.course_schedule_id);
      if (!markedByScheduleAndStudent.has(scheduleKey)) {
        markedByScheduleAndStudent.set(scheduleKey, new Set());
      }
      markedByScheduleAndStudent.get(scheduleKey).add(Number(attendance.student_id));
    });

    const courseReport = new Map();

    schedules.forEach((schedule) => {
      const courseId = Number(schedule.course_id);
      const expectedActive = activeStudentsByCourse.get(courseId);

      if (!expectedActive || expectedActive.size === 0) {
        return;
      }

      const markedStudents = markedByScheduleAndStudent.get(Number(schedule.id)) || new Set();

      let missingMark = false;
      for (const studentId of expectedActive) {
        if (!markedStudents.has(studentId)) {
          missingMark = true;
          break;
        }
      }

      if (!missingMark) return;

      const course = schedule.course;
      const professor = course?.professor;
      const professorUser = professor?.user;

      if (!professor || !professorUser) return;

      if (!courseReport.has(courseId)) {
        courseReport.set(courseId, {
          course_id: courseId,
          course_code: course.course_number,
          course_name: course.course_name,
          professor_name: professorUser.name,
          untaken_classes_count: 0,
        });
      }

      const entry = courseReport.get(courseId);
      entry.untaken_classes_count += 1;
    });

    return { data: Array.from(courseReport.values()) };
  });
};
