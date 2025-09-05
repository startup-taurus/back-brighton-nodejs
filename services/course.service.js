const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { Op, fn, col, literal } = require('sequelize');
const { COURSE_TYPES } = require('../utils/constants');
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
    const result = await _course.findAndCountAll({});

    return {
      data: {
        result: result.rows,
        totalCount: result.count,
      },
    };
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

    return {
      data: {
        course_name: course.course_name,
        course_number: course.course_number,
        course_type: course.course_type, 
        total_students: course.students.length,
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
    filters?.status && (where.status = trimmedQuery.status);
    filters?.course_name &&
      (where.course_name = { [Op.like]: `%${trimmedQuery.course_name}%` });
    filters?.course_number &&
      (where.course_number = { [Op.like]: `%${trimmedQuery.course_number}%` });
    filters?.course_type &&
      (where.course_type = { [Op.like]: `%${trimmedQuery.course_type}%` });

    const professorInclude = {
      model: _professor,
      as: 'professor',
      ...(trimmedQuery.teacher_name && { required: true }),
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['name'],
          ...(trimmedQuery.teacher_name && {
            where: {
              name: { [Op.like]: `%${trimmedQuery.teacher_name}%` },
            },
          }),
        },
      ],
    };

    let countOptions = {
      where,
    };

    if (trimmedQuery.teacher_name) {
      countOptions.include = [professorInclude];
      countOptions.distinct = true;
    }

    const syllabusInclude = {
      model: _syllabus,
      as: 'syllabus',
      required: false,
      attributes: ['id', 'syllabus_name', 'level_id'],
      include: [
        {
          model: _level,
          as: 'level',
          required: false,
          attributes: ['id', 'full_level'],
        },
      ],
    };

    const totalCount = await _course.count(countOptions);

    const courses = await _course.findAll({
      where,
      include: [professorInclude, syllabusInclude],
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      order: [['id', 'DESC']],
    });

    return {
      data: {
        result: courses,
        totalCount: totalCount,
      },
    };
  });

  getActiveCourses = catchServiceAsync(
    async (page = 1, limit = 100, search = '') => {
      let limitNumber = parseInt(limit);
      let pageNumber = parseInt(page);
      const offset = (pageNumber - 1) * limitNumber;

      const courses = await _course.findAll({
        where: {
          status: 'active',
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
        },
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

    if (course_type === COURSE_TYPES.PRIVATE || course_type === COURSE_TYPES.PRIVATE_ONLINE) {
      validateParameters({
        course_name,
        course_number,
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
        course_number,
        start_date,
        status,
        course_type,
        schedule,
        professor_id,
        syllabus_id,
      });

      body.syllabus_id = parseInt(syllabus_id);
    }

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
    
    if (body.professor_id) {
      const professor = await _professor.findByPk(body.professor_id);
      if (!professor) {
        throw new AppError('Professor not found', 404);
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
              attributes: ['name'],
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
      if (course.professor && course.professor.user) {
        professor_name = course.professor.user.name;
      }

      let level_name = 'No asignado';
      if (course.syllabus && course.syllabus.level) {
        level_name = course.syllabus.level.full_level || course.syllabus.level.short_level || 'No asignado';
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
        level_name: level_name
      };
    });

    return {
      data: calendarData,
    };
  });
};
