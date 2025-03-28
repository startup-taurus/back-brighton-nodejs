const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const {
  validateParameters,
  scheduleStringToDates,
  hasClassToday,
} = require('../utils/utils');
const { Op, col, fn } = require('sequelize');
const { DAYS_OF_WEEK } = require('../utils/constants');

let _user = null;
let _course = null;
let _student = null;
let _professor = null;
let _attendance = null;
let _userService = null;
let _courseSchedule = null;

module.exports = class ProfessorService extends BaseService {
  constructor({
    User,
    Professor,
    Course,
    Student,
    Attendance,
    UserService,
    CourseSchedule,
  }) {
    super(Professor);
    _user = User.User;
    _professor = Professor.Professor;
    _course = Course.Course;
    _student = Student.Student;
    _courseSchedule = CourseSchedule.CourseSchedule;
    _attendance = Attendance.Attendance;

    _userService = UserService;
  }

  getAllProfessors = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10, ...filters } = query;
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    const trimmedQuery = {
      ...query,
      name: query.name?.trim(),
      status: query.status?.trim(),
    };

    let where = {};
    filters?.status && (where.status = trimmedQuery.status);

    const data = await _professor.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      where,
      include: [
        {
          model: _user,
          where: {
            ...(trimmedQuery.name && {
              name: { [Op.like]: `%${trimmedQuery.name}%` },
            }),
          },
          as: 'user',
          attributes: [
            'id',
            'name',
            'email',
            'role',
            'username',
            'image',
            'last_login',
          ],
        },
      ],
    });

    return {
      data: {
        result: data.rows.map((professor) => ({
          id: professor.id,
          cedula: professor.cedula,
          status: professor.status,
          email: professor.email,
          phone: professor.phone,
          hourly_rate: professor.hourly_rate,
          report_link: professor.report_link,
          user: professor.user,
        })),
        totalCount: data.count,
      },
    };
  });

  getProfessor = catchServiceAsync(async (id) => {
    const professor = await _professor.findByPk(id, {
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!professor) {
      throw new AppError('Professor not found', 404);
    }

    return { data: professor };
  });

  getProfessorCourses = catchServiceAsync(async (professorId) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const professor = await _professor.findOne({
      where: { user_id: professorId },
      include: [
        {
          model: _course,
          as: 'courses',
          where: { status: 'active' },
          include: [
            {
              model: _student,
              as: 'students',
              through: { attributes: [] },
            },
            {
              model: _courseSchedule,
              as: 'course_schedules',
              include: [{ model: _attendance }],
            },
          ],
        },
      ],
    });

    if (!professor) {
      throw new AppError('Professor not found', 404);
    }

    const currentProfessor = professor.toJSON();

    const coursesWithStudentCount = currentProfessor.courses.map((course) => {
      const schedule = course.schedule
        ? scheduleStringToDates(course.schedule)
        : null;

      const hasClassToday = course.course_schedules.some(
        (schedule) => schedule.scheduled_date === today
      );

      const hasBeenTakenAttendance = course.course_schedules.some(
        (schedule) =>
          schedule.scheduled_date === today && schedule.attendances.length > 0
      );

      const courseDates = course.course_schedules.map(
        (schedule) => new Date(schedule.scheduled_date)
      );

      const lastCourseDate = courseDates.length
        ? new Date(Math.max(...courseDates.map((f) => f.getTime())))
        : null;

      let endThisMoth = false;
      if (lastCourseDate) {
        const lasMothClass = lastCourseDate.getMonth() + 1;
        const yearLastClass = lastCourseDate.getFullYear();

        endThisMoth =
          lasMothClass === new Date().getMonth() + 1 &&
          yearLastClass === new Date().getFullYear();
      }

      return {
        course_id: course.id,
        course_name: course.course_name,
        course_number: course.course_number,
        student_count: course.students.length,
        classSchedule: course.schedule,
        schedule,
        options: {
          hasClassToday,
          hasBeenTakenAttendance: hasClassToday
            ? (() => {
                if (hasBeenTakenAttendance) {
                  return true;
                }

                const now = new Date();
                const currentHour = now.getHours();
                const currentMinutes = now.getMinutes();

                const todaySchedule = schedule
                  ? schedule.find((s) => {
                      const dayOfWeek = now.getDay();
                      return DAYS_OF_WEEK[s.day.toUpperCase()] === dayOfWeek;
                    })
                  : null;

                if (!todaySchedule) {
                  return true;
                }

                const [startHour, startMinutes] = todaySchedule.startTime
                  .split(':')
                  .map(Number);

                const isPastStartTime =
                  currentHour > startHour ||
                  (currentHour === startHour && currentMinutes >= startMinutes);

                return !isPastStartTime;
              })()
            : false,
          endThisMoth,
          isAreadyEnd: lastCourseDate && lastCourseDate < new Date(),
        },
      };
    });

    const totalCourses = currentProfessor.courses.length;

    const totalStudents = currentProfessor.courses.reduce(
      (acc, course) => acc + course.students.length,
      0
    );

    return {
      data: {
        professor_name: currentProfessor.name,
        total_courses: totalCourses,
        total_students: totalStudents,
        courses: coursesWithStudentCount,
      },
    };
  });

  getActiveProfessors = catchServiceAsync(
    async (page = 1, limit = 10, search = '') => {
      let limitNumber = parseInt(limit);
      let pageNumber = parseInt(page);
      const offset = (pageNumber - 1) * limitNumber;
      const today = new Date();

      const professors = await _professor.findAll({
        where: {
          status: 'active',
          ...(search && {
            course_name: {
              [Op.like]: `%${search}%`,
            },
          }),
        },
        include: [
          {
            model: _user,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
        limit: limitNumber,
        offset,
      });

      return {
        data: professors,
      };
    }
  );

  getProfessorsCourseAndStudentCount = catchServiceAsync(async () => {
    const professors = await _professor.findAll({
      where: { status: 'active' },
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['id', 'name'],
        },
        {
          model: _course,
          as: 'courses',
          attributes: [],
          include: [
            {
              model: _student,
              as: 'students',
              attributes: [],
              through: { attributes: [] },
            },
          ],
        },
      ],
      group: ['professor.id', 'user.id'],
      attributes: [
        'id',
        [col('user.name'), 'professorName'],
        [fn('COUNT', fn('DISTINCT', col('courses.id'))), 'totalCourses'],
        [
          fn('COUNT', fn('DISTINCT', col('courses->students.id'))),
          'totalStudents',
        ],
      ],
    });

    return {
      data: professors,
    };
  });

  createProfessor = catchServiceAsync(async (body) => {
    body.role = 'professor';
    const {
      name,
      username,
      email,
      password,
      cedula,
      status,
      hourly_rate,
      phone,
      report_link,
    } = body;

    validateParameters({
      name,
      username,
      email,
      password,
      cedula,
      status,
      hourly_rate,
    });

    const userResponse = await _userService.createUser(body);

    const user = userResponse.data;

    const professor = await _professor.create({
      user_id: user.id,
      cedula,
      status,
      email,
      phone,
      hourly_rate,
      report_link,
    });

    return { data: professor };
  });

  updateProfessor = catchServiceAsync(async (id, body) => {
    const { email, cedula, status, hourly_rate, phone } = body;
    const professor = await _professor.findByPk(id);
    if (!professor) {
      throw new AppError('Professor not found', 404);
    }

    await _userService.updateUser(professor.user_id, body);
    await _professor.update(
      {
        cedula,
        status,
        email,
        phone,
        hourly_rate,
      },
      { where: { id } }
    );
    const updatedProfessor = await _professor.findByPk(id, {
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['name', 'username', 'email', 'status'],
        },
      ],
    });

    return { data: updatedProfessor };
  });

  updateProfessorStatus = catchServiceAsync(async (id, body) => {
    const { status } = body;
    validateParameters({ id, status });
    const professor = await _professor.update({ status }, { where: { id } });
    return { data: professor };
  });

  deleteProfessor = catchServiceAsync(async (id) => {
    const professor = await _professor.findByPk(id);

    if (!professor) {
      throw new AppError('Professor not found', 404);
    }

    await _professor.destroy({ where: { id } });
    await _user.destroy({ where: { id: professor.user_id } });

    return {
      message: 'Professor and associated user deleted successfully',
      data: {},
    };
  });
};
