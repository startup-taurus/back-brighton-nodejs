const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { Op, fn, col, literal } = require('sequelize');
const { COURSE_TYPES, STATUS, ERROR_MESSAGES } = require('../utils/constants');
const {
  validateParameters,
  scheduleStringToDates,
  calculateClassDates,
} = require('../utils/utils');
let _user = null;
let _course = null;
let _professor = null;
let _student = null;
let _sequelize = null;
let _syllabusService = null;
let _syllabusItems = null;
let _gradingItem = null;
let _courseGrading = null;
let _courseSchedule = null;
let _holidays = null;
let _grades = null;
let _syllabus = null;
let _level = null;
let _transferData = null;

const normalizeCourseNumber = (courseNumber) => {
  if (courseNumber === null || courseNumber === undefined) return courseNumber;
  return String(courseNumber)
    .trim()
    .replace(/[°º˚ᵒ⁰○◦]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
};

const formatCourseNumberForStorage = (courseNumber) => {
  const normalized = normalizeCourseNumber(courseNumber);
  return normalized ? `${normalized}°` : normalized;
};

module.exports = class CourseService extends BaseService {
  constructor({
    Sequelize,
    Course,
    Professor,
    Student,
    User,
    CourseSchedule,
    SyllabusService,
    SyllabusItems,
    CourseGrading,
    GradingItem,
    Holidays,
    Grades,
    Syllabus,
    Level,
    TransferData,
  }) {
    super(Course);
    _user = User.User;
    _course = Course.Course;
    _professor = Professor.Professor;
    _student = Student.Student;
    _syllabusItems = SyllabusItems.SyllabusItems;
    _syllabusService = SyllabusService;
    _courseSchedule = CourseSchedule.CourseSchedule;
    _courseGrading = CourseGrading.CourseGrading;
    _gradingItem = GradingItem.GradingItem;
    _holidays = Holidays.Holidays;
    _grades = Grades.Grades;
    _sequelize = Sequelize;
    _syllabus = Syllabus.Syllabus;
    _level = Level.Level;
    _transferData = TransferData.TransferData;
  }

  getAllCoursesWithoutFilters = catchServiceAsync(async () => {
    const result = await _course.findAndCountAll();

    return {
      data: {
        result: result.rows,
      },
    };
  });

  getAllCourses = catchServiceAsync(async () => {
    const totalCount = await _course.count({});

    const courses = await _course.findAll({
      include: [
        {
          model: _courseSchedule,
          as: 'course_schedule',
          required: false,
          attributes: ['scheduled_date'],
        },
      ],
      order: [['id', 'DESC']],
    });

    const coursesWithDates = courses.map((course) => {
      const courseData = course.toJSON();
      const schedules = Array.isArray(courseData.course_schedule) ? courseData.course_schedule : [];
      const dates = schedules.map((s) => s?.scheduled_date).filter(Boolean);

      if (dates.length > 0) {
        const firstDateStr = dates.reduce((min, d) => (min && min < d ? min : d), dates[0]);
        const lastDateStr = dates.reduce((max, d) => (max && max > d ? max : d), dates[0]);
        courseData.first_class_date = new Date(firstDateStr + 'T00:00:00');
        courseData.last_class_date = new Date(lastDateStr + 'T00:00:00');
      } else {
        courseData.first_class_date = courseData.start_date;
        courseData.last_class_date = courseData.end_date;
      }

      delete courseData.course_schedule;
      return courseData;
    });

    return { data: { result: coursesWithDates, totalCount } };
  });

  getCourse = catchServiceAsync(async (id) => {
    const course = await _course.findByPk(id, { raw: true });
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    return {
      data: {
        ...course,
        schedule: course.schedule
          ? scheduleStringToDates(course.schedule)
          : null,
      },
    };
  });

  getCourseWithStudents = catchServiceAsync(async (courseId) => {
    const course = await _course.findByPk(courseId, {
      include: [
        {
          model: _professor,
          as: 'professor',
          include: [
            {
              model: _user,
              as: 'user',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: _student,
          as: 'students',
          include: [
            {
              model: _user,
              as: 'user',
              where: {isActive:1},
              attributes: ['id', 'name', 'status'],
            },
            
          ],
          through: {
            attributes: ['enrollment_date', 'is_retired', 'observations'],
          },
        },
      ],
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const studentList = course.students.map((student) => ({
      id: student.id,
      name: student.user.name,
      status: student.status,
      enrollment_date: student.courseStudent?.enrollment_date,
      is_retired: student.courseStudent?.is_retired,
      observations: student.courseStudent?.observations,
    }));

    const activeStudentsCount = studentList.filter(
      (student) => !student.is_retired
    ).length;

    return {
      data: {
        course_name: course.course_name,
        course_number: course.course_number,
        course_type: course.course_type, 
        total_students: course.students.length,
        historical_students_count: course.students.length,
        active_students_count: activeStudentsCount,
        students: studentList,
        professor: { ...course.professor.user.dataValues },
      },
    };
  });

  getAllCoursesWithProfessors = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10, ...filters } = query;

    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    const trimmedQuery = {
      ...query,
      status: query.status?.trim(),
      course_name: query.course_name?.trim(),
      course_number: query.course_number?.trim(),
      course_type: query.course_type?.trim(),
      teacher_name: query.teacher_name?.trim(),
    };

    let where = {};
    const isTransferredFilter =
      !!trimmedQuery.status && trimmedQuery.status.toLowerCase() === STATUS.TRANSFERRED;
    if (filters?.status && !isTransferredFilter) {
      where.status = trimmedQuery.status;
    }
    filters?.course_name &&
      (where.course_name = { [Op.like]: `%${trimmedQuery.course_name}%` });
    filters?.course_number &&
      (where.course_number = { [Op.like]: `%${trimmedQuery.course_number}%` });
    filters?.course_type &&
      (where.course_type = { [Op.like]: `%${trimmedQuery.course_type}%` });

    const professorInclude = {
      model: _professor,
      as: 'professor',
      attributes: ['id', 'user_id'],
      ...(trimmedQuery.teacher_name && { required: true }),
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['name'],
          ...(trimmedQuery.teacher_name && {
            where: { name: { [Op.like]: `%${trimmedQuery.teacher_name}%` } },
          }),
        },
      ],
    };
    let countOptions = { where };
    if (trimmedQuery.teacher_name) {
      countOptions.include = [professorInclude];
      countOptions.distinct = true;
    }

    const syllabusInclude = {
      model: _syllabus,
      as: 'syllabus',
      required: false,
      attributes: ['id', 'syllabus_name', 'level_id'],
      include: [{ model: _level, as: 'level', required: false, attributes: ['id', 'full_level'] }],
    };

    const courseScheduleInclude = {
      model: _courseSchedule,
      as: 'course_schedule',
      required: false,
      attributes: ['scheduled_date'],
    };

    const activeStudentsInclude = {
      model: _student,
      as: 'students',
      attributes: ['id'],
      required: false,
      include: [
        { model: _user, as: 'user', attributes: ['id'], where: { isActive: 1 }, required: false },
      ],
      through: { attributes: [], where: { is_retired: 0 } },
    };
    const mapCourseWithDates = (course) => {
      const courseData = course.toJSON();
      courseData.active_student_count = Array.isArray(courseData.students)
        ? courseData.students.length
        : 0;
      delete courseData.students;
      const schedules = Array.isArray(courseData.course_schedule) ? courseData.course_schedule : [];
      const dates = schedules.map((s) => s?.scheduled_date).filter(Boolean);
      if (dates.length > 0) {
        const first = dates.reduce((min, d) => (min && min < d ? min : d), dates[0]);
        const last = dates.reduce((max, d) => (max && max > d ? max : d), dates[0]);
        courseData.first_class_date = new Date(first + 'T00:00:00');
        courseData.last_class_date = new Date(last + 'T00:00:00');
      } else {
        courseData.first_class_date = courseData.start_date;
        courseData.last_class_date = courseData.end_date;
      }
      delete courseData.course_schedule;
      return courseData;
    };

    const includes = [professorInclude, syllabusInclude, courseScheduleInclude, activeStudentsInclude];
    const findCourses = async (ids) => _course.findAll({
      ...(ids ? { where: { id: { [Op.in]: ids } } } : { where }),
      include: includes,
      ...(ids ? { order: [[{ model: _courseSchedule, as: 'course_schedule' }, 'scheduled_date', 'ASC']] } : {
        limit: limitNumber,
        offset: limitNumber * (pageNumber - 1),
        order: [['id', 'DESC'], [{ model: _courseSchedule, as: 'course_schedule' }, 'scheduled_date', 'ASC']],
      }),
    });
    const getLatestTransfers = async (ids) => {
      const rows = await _transferData.findAll({
        where: { status_level_change: 'approved', selected_course_id: { [Op.in]: ids } },
        attributes: ['selected_course_id', 'updated_at', 'created_at'],
      });
      return rows.reduce((acc, t) => {
        const ts = t.updated_at || t.created_at; const id = t.selected_course_id;
        if (!acc[id] || new Date(ts) > new Date(acc[id])) acc[id] = ts; return acc;
      }, {});
    };
    const getCoursesWithDates = async () => {
      const rows = await findCourses();
      return rows.map(mapCourseWithDates);
    };

    if (isTransferredFilter) {
      const transferred = await _course.findAll({
        ...countOptions,
        where: { ...where, status: { [Op.in]: ['transferred','Transferred','TRANSFERRED'] } },
        attributes: ['id'],
        include: [...(countOptions.include || [])],
      });
      const ids = transferred.map(c => c.id);
      const totalCount = ids.length;
      if (!ids.length) return { data: { result: [], totalCount } };
      const coursesWithDates = (await findCourses(ids)).map(mapCourseWithDates);
      const latest = await getLatestTransfers(ids);
      const sorted = coursesWithDates
        .map(c => ({ ...c, transfer_ts: latest[c.id] ? new Date(latest[c.id]) : null }))
        .sort((courseA, courseB) => {
          const transferTimeA = courseA.transfer_ts ? courseA.transfer_ts.getTime() : 0;
          const transferTimeB = courseB.transfer_ts ? courseB.transfer_ts.getTime() : 0;
          if (transferTimeB !== transferTimeA) return transferTimeB - transferTimeA;
          const endTimeA = (courseA.last_class_date ? new Date(courseA.last_class_date).getTime() : 0) || (courseA.end_date ? new Date(courseA.end_date).getTime() : 0);
          const endTimeB = (courseB.last_class_date ? new Date(courseB.last_class_date).getTime() : 0) || (courseB.end_date ? new Date(courseB.end_date).getTime() : 0);
          if (endTimeB !== endTimeA) return endTimeB - endTimeA;
          return (courseB.id || 0) - (courseA.id || 0);
        });
      const start = limitNumber * (pageNumber - 1);
      const end = start + limitNumber;
      return { data: { result: sorted.slice(start, end), totalCount } };
    }

    const totalCount = await _course.count(countOptions);
    const coursesWithDates = await getCoursesWithDates();
    return { data: { result: coursesWithDates, totalCount } };
  });

  getActiveCourses = catchServiceAsync(
    async (page = 1, limit = 100, search = '', status = 'active') => {
      let limitNumber = parseInt(limit);
      let pageNumber = parseInt(page);
      const offset = (pageNumber - 1) * limitNumber;

      const normalizedStatus = String(status || 'active').toLowerCase();
      const allowedStatuses = ['active', 'inactive'];
      const statusFilter = allowedStatuses.includes(normalizedStatus)
        ? normalizedStatus
        : 'active';

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const whereClause = {
        status: statusFilter,
        ...(search && {
          [Op.or]: [
            {
              course_name: {
                [Op.like]: `%${search}%`,
              },
            },
            {
              course_number: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        }),
      };

      if (_course.rawAttributes?.last_class_date) {
        whereClause[Op.and] = [
          {
            [Op.or]: [
              {
                last_class_date: {
                  [Op.is]: null,
                },
              },
              {
                last_class_date: {
                  [Op.gte]: today,
                },
              },
            ],
          },
        ];
      }

      const courses = await _course.findAll({
        where: whereClause,
        include: [
          {
            model: _professor,
            as: 'professor',
            include: [
              {
                model: _user,
                as: 'user',
                attributes: ['name'],
              },
            ],
          },
          {
            model: _syllabus,
            as: 'syllabus',
            required: false, 
            attributes: ['id', 'syllabus_name'],
            include: [
              {
                model: _level,
                as: 'level',
                required: false,
                attributes: ['id', 'full_level'],
              },
            ],
          },
        ],
        limit: limitNumber,
        offset,
        order: [['id', 'DESC']],
      });

      console.log('[CourseService.getActiveCourses]', {
        status: statusFilter,
        page: pageNumber,
        limit: limitNumber,
        search,
        lastClassDateFilterApplied: Boolean(_course.rawAttributes?.last_class_date),
        returned: courses.length,
      });

      return {
        data: courses,
      };
    }
  );

  getAcademicPerformance = catchServiceAsync(async (req, res) => {
    const courses = await _course.findAll({
      attributes: [
        'id',
        'course_name',
        [fn('AVG', col('grades.grade')), 'avgGrade'],
      ],
      include: [
        {
          model: _grades,
          as: 'grades',
          attributes: [],
        },
      ],
      group: ['id', 'course_name'],
    });

    const categories = courses.map((course) => course.course_name);
    const seriesData = courses.map(
      (course) => parseFloat(course.get('avgGrade')) || 0
    );

    const chartData = {
      series: [
        {
          name: 'Calificación Promedio',
          data: seriesData,
        },
      ],
      options: {
        chart: {
          id: 'academic-performance-chart',
          type: 'area',
        },
        xaxis: {
          categories: categories,
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          curve: 'smooth',
        },
      },
    };

    return {
      data: chartData,
    };
  });

  getSchoolPerformance = catchServiceAsync(async (req, res) => {
    const performance = await _grades.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'month'],
        [fn('AVG', col('grade')), 'avgGrade'],
      ],
      group: ['month'],
      order: [[literal('month'), 'ASC']],
    });

    const categories = performance.map((item) => item.get('month'));
    const seriesData = performance.map(
      (item) => parseFloat(item.get('avgGrade')) || 0
    );

    const chartData = {
      series: [
        {
          name: 'Promedio de Calificaciones',
          data: seriesData,
        },
      ],
      options: {
        chart: {
          id: 'school-performance-chart',
          type: 'line',
        },
        xaxis: {
          categories: categories,
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          curve: 'smooth',
        },
      },
    };

    return {
      data: chartData,
    };
  });

  createCourse = catchServiceAsync(async (body) => {
    const {
      course_name,
      course_number,
      start_date,
      status,
      course_type,
      schedule,
      professor_id,
      syllabus_id,
    } = body;

    const normalizedCourseNumber = normalizeCourseNumber(course_number);

    if (course_type === COURSE_TYPES.PRIVATE || course_type === COURSE_TYPES.PRIVATE_ONLINE) {
      validateParameters({
        course_name,
        course_number: normalizedCourseNumber,
        start_date,
        status,
        course_type,
        professor_id,
      });

      body.syllabus_id = syllabus_id ? parseInt(syllabus_id) : null;
      body.schedule = null;
      body.classroom = null;
    } else {
      validateParameters({
        course_name,
        course_number: normalizedCourseNumber,
        start_date,
        status,
        course_type,
        schedule,
        professor_id,
        syllabus_id,
      });

      body.syllabus_id = parseInt(syllabus_id);
    }

    body.course_number = formatCourseNumberForStorage(course_number);

    await this.validateCourseNumberAvailability(body.course_number);

    body.professor_id = parseInt(professor_id);

    const course = await _course.create(body);

    if (course_type !== COURSE_TYPES.PRIVATE && course_type !== COURSE_TYPES.PRIVATE_ONLINE) {
      await this.createCourseSchedule(start_date, schedule, syllabus_id, course);
      
      const gradingItems = await _gradingItem.findAll({
        where: { syllabus_id },
        attributes: ['id'],
      });

      if (!gradingItems || gradingItems.length === 0) {
        throw new AppError(
          'No grading items found for the specified syllabus',
          404
        );
      }

      const courseGradingData = gradingItems.map((item) => ({
        course_id: course.id,
        grading_item_id: item.id,
        weight: 0,
      }));

      await _courseGrading.bulkCreate(courseGradingData);
    }

    return { data: course };
  });

  updateCourse = catchServiceAsync(async (id, body) => {
    delete body.professor;

    const parsedCourseId = parseInt(id, 10);

    if (body.course_number !== undefined) {
      const normalizedCourseNumber = normalizeCourseNumber(body.course_number);
      await this.validateCourseNumberAvailability(normalizedCourseNumber, parsedCourseId);
      body.course_number = formatCourseNumberForStorage(body.course_number);
    }
    
    if (body.professor_id) {
      const professor = await _professor.findByPk(body.professor_id);
      if (!professor) {
        throw new AppError(ERROR_MESSAGES.PROFESSOR_NOT_FOUND, 404);
      }
    }

    if (body.course_type === COURSE_TYPES.PRIVATE || body.course_type === COURSE_TYPES.PRIVATE_ONLINE) {
      body.syllabus_id = null;
      body.schedule = null;
      body.classroom = null;
      
      await _courseGrading.destroy({ where: { course_id: id } });
    } else if (body.syllabus_id) {
      await _courseGrading.destroy({ where: { course_id: id } });

      const gradingItems = await _gradingItem.findAll({
        where: { syllabus_id: body.syllabus_id },
        attributes: ['id'],
      });

      if (!gradingItems || gradingItems.length === 0) {
        throw new AppError(
          'No grading items found for the specified syllabus',
          404
        );
      }
      
      const courseGradingData = gradingItems.map((item) => ({
        course_id: id,
        grading_item_id: item.id,
        weight: 0,
      }));

      await _courseGrading.bulkCreate(courseGradingData);
    }

    const course = await _course.update(body, { where: { id } });
    return { data: course };
  });

  validateCourseNumberAvailability = catchServiceAsync(async (courseNumber, excludedCourseId = null) => {
    const normalizedCourseNumber = normalizeCourseNumber(courseNumber);

    validateParameters({ course_number: normalizedCourseNumber });

    const existingCourse = await this.findCourseByNormalizedNumber(
      normalizedCourseNumber,
      excludedCourseId
    );

    if (existingCourse) {
      throw new AppError('This course number is already registered', 400);
    }
  });

  findCourseByNormalizedNumber = catchServiceAsync(async (normalizedCourseNumber, excludedCourseId = null) => {
    if (!normalizedCourseNumber) {
      return null;
    }

    const existingCourses = await _course.findAll({
      ...(excludedCourseId ? { where: { id: { [Op.ne]: excludedCourseId } } } : {}),
      attributes: ['id', 'course_number'],
      raw: true,
    });

    return (
      existingCourses.find(
        (course) => normalizeCourseNumber(course.course_number) === normalizedCourseNumber
      ) || null
    );
  });

  updateCourseStatus = catchServiceAsync(async (id, body) => {
    const { status } = body;
    validateParameters({ id, status });
    const course = await _course.update({ status }, { where: { id } });
    return { data: course };
  });

  createCourseSchedule = catchServiceAsync(
    async (start_date, schedule, syllabus_id, course) => {
      let syllabus = await _syllabusService.getSyllabusById(syllabus_id);
      syllabus = syllabus.data;

      if (!syllabus ) {
        throw new AppError('Syllabus not found', 404);
      }
      if (!syllabus.items || syllabus.items.length === 0) {
        throw new AppError('Syllabus items not found', 404);
      }

      const activeHolidays = await _holidays.findAll({
        where: { status: 'active' },
      });

      const classDates = calculateClassDates(
        start_date,
        syllabus.items,
        schedule,
        activeHolidays
      );

      const scheduleCourse = classDates.map((date, index) => ({
        course_id: course.id,
        syllabus_item_id: syllabus.items[index].id,
        scheduled_date: date,
      }));

      await _courseSchedule.bulkCreate(scheduleCourse);
    }
  );

  getAllCoursesForCalendar = catchServiceAsync(async () => {
    const courses = await _course.findAll({
      where: {
        status: 'active'
      },
      attributes: ['id', 'course_name', 'course_number', 'start_date', 'schedule'],
      include: [
        {
          model: _professor,
          as: 'professor',
          attributes: ['id'],
          required: false,
          include: [
            {
              model: _user,
              as: 'user',
              attributes: ['name', 'image'],
              required: false
            }
          ]
        },
        {
          model: _syllabus,
          as: 'syllabus',
          attributes: ['id', 'syllabus_name'],
          required: false,
          include: [
            {
              model: _level,
              as: 'level',
              attributes: ['id', 'full_level', 'short_level'],
              required: false
            }
          ]
        },
        {
          model: _student,
          as: 'students',
          attributes: ['id'],
          required: false,
          include: [
            {
              model: _user,
              as: 'user',
              attributes: ['id'],
              where: { isActive: 1 },
              required: false
            }
          ],
          through: {
            attributes: [],
            where: { is_retired: 0 }
          }
        }
      ]
    });
    
    if (courses.length === 0) {
      return { data: [] };
    }

    const calendarData = courses.map(course => {
      let schedule_days = [];
      let start_time = '';
      let end_time = '';
      
      if (course.schedule) {
        const scheduleData = scheduleStringToDates(course.schedule);
        if (scheduleData && scheduleData.length > 0) {
          schedule_days = scheduleData.map(item => item.day);
          start_time = scheduleData[0].startTime;
          end_time = scheduleData[0].endTime;
        }
      }

      let end_date = null;
      if (course.start_date) {
        const startDate = new Date(course.start_date);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
        end_date = endDate.toISOString().split('T')[0];
      }

      let professor_name = 'No asignado';
      let professor_image = null;
      if (course.professor && course.professor.user) {
        professor_name = course.professor.user.name;
        professor_image = course.professor.user.image;
      }

      let level_name = 'No asignado';
      if (course.syllabus && course.syllabus.level) {
        level_name = course.syllabus.level.full_level || course.syllabus.level.short_level || 'No asignado';
      }

      let student_count = 0;
      if (course.students && course.students.length > 0) {
        student_count = course.students.filter(student => 
          student.user && student.user.id
        ).length;
      }

      return {
        id: course.id.toString(),
        course_name: course.course_name,
        course_number: course.course_number,
        start_date: course.start_date,
        end_date: end_date,
        schedule_days: schedule_days,
        start_time: start_time,
        end_time: end_time,
        professor_name: professor_name,
        professor_image: professor_image,
        level_name: level_name,
        student_count: student_count
      };
    });

    return {
      data: calendarData,
    };
  });
};
