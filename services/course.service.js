const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { Op } = require('sequelize');
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
    _sequelize = Sequelize;
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
              attributes: ['id', 'name', 'status'],
            },
          ],
          through: { attributes: [] },
        },
      ],
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const studentList = course.students.map((student) => ({
      id: student.id,
      name: student.user.name,
      status: student.user.status,
    }));

    return {
      data: {
        course_name: course.course_name,
        course_number: course.course_number,
        total_students: course.students.length,
        students: studentList,
        professor: { ...course.professor.user.dataValues },
      },
    };
  });

  getAllCoursesWithProfessors = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10 } = query;

    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);
    const courses = await _course.findAll({
      where: {
        ...(query.status && { status: query.status }),
        ...(query.course_name && {
          course_name: { [Op.like]: `%${query.course_name}%` },
        }),
        ...(query.course_number && {
          course_number: { [Op.like]: `%${query.course_number}%` },
        }),
        ...(query.course_type && {
          course_type: { [Op.like]: `%${query.course_type}%` },
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
      ],
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
    });

    return {
      data: {
        result: courses,
        totalCount: courses.length,
      },
    };
  });

  getActiveCourses = catchServiceAsync(
    async (page = 1, limit = 10, search = '') => {
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

    body.professor_id = parseInt(professor_id);
    body.syllabus_id = parseInt(syllabus_id);
    const course = await _course.create(body);

    await this.createCourseSchedule(start_date, schedule, syllabus_id, course);

    const gradingItems = await _gradingItem.findAll({
      where: { syllabus_id },
      attributes: ["id"],
    });
  
    if (!gradingItems || gradingItems.length === 0) {
      throw new AppError("No grading items found for the specified syllabus", 404);
    }

    const courseGradingData = gradingItems.map((item) => ({
      course_id: course.id,
      grading_item_id: item.id,
      weight: 0, 
    }));
  
    await _courseGrading.bulkCreate(courseGradingData);

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
    if (body.syllabus_id) {
    
      await _courseGrading.destroy({ where: { course_id: id } });

      const gradingItems = await _gradingItem.findAll({
        where: { syllabus_id: body.syllabus_id },
        attributes: ["id"],
      });
  
      if (!gradingItems || gradingItems.length === 0) {
        throw new AppError(
          "No grading items found for the specified syllabus",
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
      const syllabus = await _syllabusService.getSyllabusById(syllabus_id);

      if (!syllabus || !syllabus.items || syllabus.items.length === 0) {
        throw new AppError('Syllabus items not found', 404);
      }

      const classDates = calculateClassDates(
        start_date,
        syllabus.items,
        schedule
      );

      const scheduleCourse = classDates.map((date, index) => ({
        course_id: course.id,
        syllabus_item_id: syllabus.items[index].id,
        scheduled_date: date,
      }));

      await _courseSchedule.bulkCreate(scheduleCourse);
    }
  );
};
