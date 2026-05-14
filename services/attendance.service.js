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
    const sequelize = _course.sequelize;

    const rows = await sequelize.query(
      `SELECT
         c.id AS course_id,
         c.course_number AS course_code,
         c.course_name,
         prof_user.name AS professor_name,
         COUNT(DISTINCT CONCAT(csch.id, '-', cs.student_id)) AS untaken_classes_count
       FROM course c
       INNER JOIN professor p ON p.id = c.professor_id
       INNER JOIN user prof_user ON prof_user.id = p.user_id
       INNER JOIN course_schedule csch
         ON csch.course_id = c.id
         AND csch.scheduled_date < CURDATE()
       INNER JOIN course_student cs
         ON cs.course_id = c.id
         AND cs.is_retired = 0
         AND cs.enrollment_date <= csch.scheduled_date
         AND NOT EXISTS (
           SELECT 1 FROM course_student cs_retired
           WHERE cs_retired.course_id = cs.course_id
             AND cs_retired.student_id = cs.student_id
             AND cs_retired.is_retired = 1
         )
       INNER JOIN student s
         ON s.id = cs.student_id
         AND s.status <> 'inactive'
       INNER JOIN user stu_user
         ON stu_user.id = s.user_id
         AND stu_user.isActive = 1
       WHERE c.status = 'active'
         AND c.course_type NOT IN (:privateType, :privateOnlineType)
         AND EXISTS (
           SELECT 1 FROM course_schedule csch_f
           WHERE csch_f.course_id = c.id
             AND csch_f.scheduled_date >= CURDATE()
         )
         AND NOT EXISTS (
           SELECT 1 FROM cancelled_lesson cl
           WHERE cl.course_id = c.id
             AND DATE(cl.cancel_date) = DATE(csch.scheduled_date)
         )
         AND NOT EXISTS (
           SELECT 1 FROM attendance a
           WHERE a.course_schedule_id = csch.id
             AND a.student_id = cs.student_id
             AND a.status IS NOT NULL AND a.status <> ''
         )
       GROUP BY c.id, c.course_number, c.course_name, prof_user.name
       HAVING untaken_classes_count > 0
       ORDER BY untaken_classes_count DESC`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          privateType: COURSE_TYPES.PRIVATE,
          privateOnlineType: COURSE_TYPES.PRIVATE_ONLINE,
        },
      }
    );

    return {
      data: rows.map((row) => ({
        course_id: Number(row.course_id),
        course_code: row.course_code,
        course_name: row.course_name,
        professor_name: row.professor_name,
        untaken_classes_count: Number(row.untaken_classes_count),
      })),
    };
  });
};
