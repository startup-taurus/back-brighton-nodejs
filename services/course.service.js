const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const AppError = require("../utils/app-error");
const { validateParameters } = require("../utils/utils");
let _user = null;
let _course = null;
let _professor = null;
let _student = null;
let _sequelize = null;

module.exports = class CourseService extends BaseService {
  constructor({ Sequelize, Course, Professor, Student, User }) {
    super(Course);
    _user = User.User;
    _course = Course.Course;
    _professor = Professor.Professor;
    _student = Student.Student;
    _sequelize = Sequelize;
  }

  getAllCourses = catchServiceAsync(async (page = 1, limit = 10) => {
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);
    const result = await _course.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
    });

    return {
      data: {
        result: result.rows,
        totalCount: result.count,
      },
    };
  });

  getCourse = catchServiceAsync(async (id) => {
    const course = await _course.findByPk(id);
    if (!course) {
      throw new AppError("Course not found", 404);
    }
    return { data: course };
  });

  getCourseWithStudents = catchServiceAsync(async (courseId) => {
    const course = await _course.findByPk(courseId, {
      include: [
        {
          model: _professor,
          as: "professor",
          include: [
            {
              model: _user,
              as: "user",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: _student,
          as: "students",
          include: [
            {
              model: _user,
              as: "user",
              attributes: ["id", "name", "status"],
            },
          ],
          through: { attributes: [] },
        },
      ],
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const studentList = course.students.map((student) => ({
      id: student.user.id,
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

  getAllCoursesWithProfessors = catchServiceAsync(
    async (page = 1, limit = 10) => {
      const courses = await _course.findAll({
        include: [
          {
            model: _professor,
            as: "professor",
            include: [
              {
                model: _user,
                as: "user",
                attributes: ["name"],
              },
            ],
          },
        ],
      });

      if (!courses || courses.length === 0) {
        throw new AppError("No courses found", 404);
      }

      return {
        data: {
          result: courses,
          totalCount: courses.length,
        },
      };
    }
  );

  createCourse = catchServiceAsync(async (body) => {
    const {
      course_name,
      course_number,
      start_date,
      end_date,
      comment,
      status,
      course_type,
      hourly_rate,
      professor_id,
    } = body;

    validateParameters({
      course_name,
      course_number,
      start_date,
      end_date,
      comment,
      status,
      course_type,
      hourly_rate,
      professor_id,
    });

    body.professor_id = parseInt(professor_id);
    const course = await _course.create(body);
    return { data: course };
  });

  updateCourse = catchServiceAsync(async (id, body) => {
    const course = await _course.update(body, { where: { id } });
    return { data: course };
  });
};
