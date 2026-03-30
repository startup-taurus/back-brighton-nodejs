const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const {
  validateParameters,
  scheduleStringToDates,
  hasClassToday,
} = require('../utils/utils');
const {Op, col, fn} = require('sequelize');
const {DAYS_OF_WEEK, STATUS, ERROR_MESSAGES} = require('../utils/constants');
const {orderBy} = require('lodash');

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
    const {page = 1, limit = 10, ...filters} = query;
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
              name: {[Op.like]: `%${trimmedQuery.name}%`},
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
      order: [['id', 'DESC']],
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

  getProfessorActiveCoursesForCalendar = catchServiceAsync(async (professorId) => {
    const professor = await _professor.findOne({
      where: { user_id: professorId },
      include: [{
        model: _course,
        as: 'courses',
        where: { status: STATUS.ACTIVE },
        include: [
          { model: _student, as: 'students', attributes: ['id'], required: false, through: { attributes: [], where: { is_retired: 0 } } },
          { model: _courseSchedule, as: 'course_schedules', attributes: ['id', 'scheduled_date'], required: false },
        ],
        required: false,
      }],
    });
    if (!professor) { throw new AppError(ERROR_MESSAGES.PROFESSOR_NOT_FOUND, 404); }

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const courses = (professor.toJSON().courses || [])
      .filter((course) => {
        if (course.course_number?.includes('COPY')) return false;
        const schedules = course.course_schedules || [];
        const futureScheduleDates = schedules.filter((schedule) => {
          const scheduleDate = new Date(schedule.scheduled_date);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate >= tomorrow;
        });
        const lastClassDate = schedules.length
          ? new Date(Math.max(...schedules.map((s) => new Date(s.scheduled_date))))
          : null;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const daysSinceLastClass = lastClassDate
          ? Math.floor((todayStart.getTime() - lastClassDate.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const hasFutureClasses = futureScheduleDates.length > 0;
        const isStaleCourse = daysSinceLastClass > 7 && !hasFutureClasses;
        const isPastEndDate = course.end_date && new Date(course.end_date) < new Date() && !hasFutureClasses;
        return hasFutureClasses && !isStaleCourse && !isPastEndDate;
      })
      .map((course) => {
        const schedules = course.course_schedules || [];
        const startStr = schedules.length
          ? schedules
              .map((s) => s.scheduled_date)
              .filter(Boolean)
              .reduce((min, d) => (min && min < d ? min : d), schedules[0].scheduled_date)
          : course.start_date || null;
        const endDate = schedules.length
          ? new Date(Math.max(...schedules.map((s) => new Date(s.scheduled_date))))
          : course.start_date
          ? new Date(new Date(course.start_date).setMonth(new Date(course.start_date).getMonth() + 3))
          : null;
        const hasClassToday = schedules.some((s) => s.scheduled_date === todayStr);
        return {
          course_id: course.id,
          course_name: course.course_name,
          course_number: course.course_number,
          student_count: course.students?.length || 0,
          classSchedule: course.schedule,
          schedule: course.schedule ? scheduleStringToDates(course.schedule) : null,
          start_date: startStr,
          end_date: endDate,
          options: { hasClassToday },
        };
      });

    return { data: { courses } };
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
      throw new AppError(ERROR_MESSAGES.PROFESSOR_NOT_FOUND, 404);
    }

    return {data: professor};
  });

  getProfessorCourses = catchServiceAsync(async (professorId) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); 

    const professor = await _professor.findOne({
      where: {user_id: professorId},
      include: [
        {
          model: _course,
          as: 'courses',
          where: {status: STATUS.ACTIVE},
          include: [
            {
              model: _student,
              as: 'students',
              through: {attributes: []},
            },
            {
              model: _courseSchedule,
              as: 'course_schedules',
              include: [{model: _attendance}],
            },
          ],
        },
      ],
    });

    if (!professor) {
      throw new AppError(ERROR_MESSAGES.PROFESSOR_NOT_FOUND, 404);
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
      let end_date = null;
      if (lastCourseDate) {
        end_date = new Date(lastCourseDate);
      } else if (course.start_date) {
        const startDate = new Date(course.start_date);
        end_date = new Date(startDate);
        end_date.setMonth(startDate.getMonth() + 3);
      } else {
        end_date = null;
      }

      let endThisMoth = false;
      if (lastCourseDate) {
        const lasMothClass = lastCourseDate.getMonth() + 1;
        const yearLastClass = lastCourseDate.getFullYear();

        endThisMoth =
          lasMothClass === new Date().getMonth() + 1 &&
          yearLastClass === new Date().getFullYear();
      }

      const firstStr = course.course_schedules.length
        ? course.course_schedules.map((s) => s.scheduled_date).filter(Boolean).reduce((min, d) => (min && min < d ? min : d), course.course_schedules[0].scheduled_date)
        : (course.start_date || null);

      return {
        course_id: course.id,
        course_name: course.course_name,
        course_number: course.course_number,
        student_count: course.students ? course.students.length : 0,
        classSchedule: course.schedule,
        schedule,
        start_date: firstStr,
        end_date: end_date,
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
    const allCourses = coursesWithStudentCount.map((course) => {
      let isCompleted = false;
      if (course.end_date) {
        const courseEndDate = new Date(course.end_date);
        courseEndDate.setHours(0, 0, 0, 0);
        isCompleted = courseEndDate < currentDate;
      }
      
      return {
        ...course,
        isCompleted: isCompleted
      };
    });

    const totalCourses = allCourses.length;

    const totalStudents = allCourses.reduce(
      (acc, course) => acc + (course.student_count || 0),
      0
    );

    return {
      data: {
        professor_name: currentProfessor.name,
        total_courses: totalCourses,
        total_students: totalStudents,
        courses: allCourses,
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
          status: STATUS.ACTIVE,
        },
        include: [
          {
            model: _user,
            as: 'user',
            where: {
              ...(search && {
                name: {
                  [Op.like]: `%${search}%`,
                },
              }),
            },
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

  getProfessorsCourseAndStudentCount = catchServiceAsync(async (query) => {
    const {page = 1, limit = 10} = query;
    const limitNumber = parseInt(limit, 10);
    const pageNumber = parseInt(page, 10);
    const offset = limitNumber * (pageNumber - 1);

    const totalCount = await _professor.count({
      where: {status: STATUS.ACTIVE},
    });

    const professors = await _professor.findAll({
      where: {status: STATUS.ACTIVE},
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
              where: {
                status: STATUS.ACTIVE, 
              },
              through: {
                attributes: [],
                where: {
                  is_retired: 0, 
                },
              },
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
      order: [['id', 'DESC']],
      limit: limitNumber,
      offset: offset,
      subQuery: false,
    });

    const result = professors.map((professor) => professor.get({plain: true}));

    return {
      data: {
        result,
        totalCount,
        page: pageNumber,
        limit: limitNumber,
      },
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
      image,
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

    await _userService.validateDuplicateByRole(email, cedula, 'professor', username);
    const file = image ? { filename: image } : null;
    const userResponse = await _userService.createUser(body, file, false, true);
    
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

    return {data: professor};
  });

  updateProfessor = catchServiceAsync(async (id, body) => {
    const {email, cedula, status, hourly_rate, phone, image} = body;
    const professor = await _professor.findByPk(id, {
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['id', 'name', 'username', 'email', 'status', 'image'],
        },
      ],
    });

    if (!professor) {
      throw new AppError(ERROR_MESSAGES.PROFESSOR_NOT_FOUND, 404);
    }

    if (email || cedula || body.username) {
      await _userService.validateDuplicateByRole(
        email || professor.email, 
        cedula || professor.cedula, 
        'professor', 
        body.username || professor.user.username,
        professor.user_id
      );
    }

    const file = image ? { filename: image } : null;
      await _professor.sequelize.transaction(async (transaction) => {
        await _userService.updateUser(professor.user_id, body, file, {transaction});
        await _professor.update(
          {
            cedula,
            status,
            email,
            phone,
            hourly_rate,
          },
          {where: {id}, transaction}
        );
      });

    const updatedProfessor = await _professor.findByPk(id, {
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['name', 'username', 'email', 'status', 'image'],
        },
      ],
    });

    return {data: updatedProfessor};
  });

  updateProfessorStatus = catchServiceAsync(async (id, body) => {
    const {status} = body;
    validateParameters({id, status});
    const professor = await _professor.update({status}, {where: {id}});
    return {data: professor};
  });

  deleteProfessor = catchServiceAsync(async (id) => {
    const professor = await _professor.findByPk(id);

    if (!professor) {
      throw new AppError(ERROR_MESSAGES.PROFESSOR_NOT_FOUND, 404);
    }

    await _professor.destroy({where: {id}});
    await _user.destroy({where: {id: professor.user_id}});

    return {
      message: 'Professor and associated user deleted successfully',
      data: {},
    };
  });

  getAllProfessorsCourses = catchServiceAsync(async () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const professors = await _professor.findAll({
      where: {status: STATUS.ACTIVE},
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          where: { status: STATUS.ACTIVE }
        },
        {
          model: _course,
          as: 'courses',
          where: {status: STATUS.ACTIVE},
          include: [
            {
              model: _student,
              as: 'students',
              through: {
                attributes: [],
                where: {
                  is_retired: false
                }
              },
              include: [{
                model: _user,
                as: 'user',
                where: { status: STATUS.ACTIVE }
              }]
            },
            {
              model: _courseSchedule,
              as: 'course_schedules',
              include: [{model: _attendance}],
            },
          ],
        },
      ],
    });

    if (!professors || professors.length === 0) {
      return {data: {professors: []}};
    }

    const professorsWithCourseDetails = professors.map((prof) => {
      const currentProfessor = prof.toJSON();
      
      const activeCourses = currentProfessor.courses.filter((course) => {
        const courseDates = course.course_schedules.map(
          (schedule) => new Date(schedule.scheduled_date + 'T00:00:00')
        );
        const lastCourseDate = courseDates.length
          ? new Date(Math.max(...courseDates.map((date) => date.getTime())))
          : null;
        
        return !lastCourseDate || lastCourseDate >= now;
      });
      
      const coursesWithDetails = activeCourses.map((course) => {
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
          ? new Date(Math.max(...courseDates.map((date) => date.getTime())))
          : null;

        const firstCourseDate = courseDates.length
          ? new Date(Math.min(...courseDates.map((date) => date.getTime())))
          : null;

        const courseStartDate = course.start_date
          ? new Date(course.start_date + 'T00:00:00')
          : firstCourseDate;

        let endThisMonth = false;
        if (lastCourseDate) {
          const lastMonthClass = lastCourseDate.getMonth() + 1;
          const yearLastClass = lastCourseDate.getFullYear();
          endThisMonth =
            lastMonthClass === now.getMonth() + 1 &&
            yearLastClass === now.getFullYear();
        }

        let endsInTwoWeeks = false;
        if (lastCourseDate) {
          const lastCourseDateTime = lastCourseDate.getTime();
          endsInTwoWeeks =
            lastCourseDateTime <= twoWeeksFromNow.getTime() &&
            lastCourseDateTime >= now.getTime();
        }

        let startsInTwoWeeks = false;
        if (courseStartDate) {
          const courseStartDateTime = courseStartDate.getTime();
          startsInTwoWeeks =
            courseStartDateTime <= twoWeeksFromNow.getTime() &&
            courseStartDateTime >= now.getTime();
        }

        return {
          course_id: course.id,
          course_name: course.course_name,
          course_number: course.course_number,
          student_count: course.students.length,
          classSchedule: course.schedule,
          schedule,
          start_date: courseStartDate ? courseStartDate.toISOString().split('T')[0] : null,
          end_date: lastCourseDate ? lastCourseDate.toISOString().split('T')[0] : null,
          options: {
            hasClassToday,
            hasBeenTakenAttendance: hasClassToday
              ? (() => {
                  if (hasBeenTakenAttendance) {
                    return true;
                  }
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
                    (currentHour === startHour &&
                      currentMinutes >= startMinutes);
                  return !isPastStartTime;
                })()
              : false,
            endThisMonth,
            endsInTwoWeeks,
            startsInTwoWeeks,
            isAlreadyEnd: lastCourseDate && lastCourseDate < now,
          },
        };
      });

      const totalCourses = activeCourses.length;
      const totalStudents = activeCourses.reduce(
        (acc, course) => acc + course.students.filter(student => 
          !student.courseStudent?.is_retired && 
          student.user?.status === STATUS.ACTIVE
        ).length,
        0
      );

      return {
        professor_id: currentProfessor.id,
        professor_name: currentProfessor.user.name,
        total_courses: totalCourses,
        total_students: totalStudents,
        courses: coursesWithDetails,
      };
    });

    return {
      data: {
        professors: professorsWithCourseDetails,
      },
    };
  });
};
