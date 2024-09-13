const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const AppError = require("../utils/app-error");
const { validateParameters } = require("../utils/utils");
let _course = null;
let _professor = null;
let _student = null;
let _sequelize = null;

module.exports = class CourseService extends BaseService {
  constructor({ Sequelize, Course, Professor, Student }) {
    super(Course);
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
      include: [
        {
          model: _professor,
          attributes: ["name"],
        },
      ],
    });

    return {
      data: {
        result: result.rows,
        totalCount: result.count,
      },
    };
  });

  getCourse = catchServiceAsync(async (id) => {
    const course = await _course.findByPk(id, {
      include: [
        {
          model: _professor,
          attributes: ["name"],
        },
      ],
    });
    if (!course) {
      throw new AppError("Course not found", 404);
    }
    return { data: course };
  });

  getCourseWithStudents = catchServiceAsync(async (courseId) => {
    const courseWithStudentsAndProfessor = await _sequelize.query(
      `SELECT c.*, p.id as professor_id, p.name as professor_name, s.id as student_id, s.name as student_name
       FROM course c
       LEFT JOIN professor p ON c.professor_id = p.id
       LEFT JOIN course_student cs ON c.id = cs.course_id
       LEFT JOIN student s ON cs.student_id = s.id
       WHERE c.id = :courseId`,
      {
        replacements: { courseId },
        type: _sequelize.QueryTypes.SELECT,
      }
    );

    if (courseWithStudentsAndProfessor.length === 0) {
      throw new Error("Course not found");
    }

    return { data: courseWithStudentsAndProfessor };
  });

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
