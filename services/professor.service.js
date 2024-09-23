const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const AppError = require("../utils/app-error");
const { validateParameters } = require("../utils/utils");

let _user = null;
let _course = null;
let _student = null;
let _professor = null;
let _userService = null;

module.exports = class ProfessorService extends BaseService {
  constructor({ User, Professor, Course, Student, UserService }) {
    super(Professor);
    _user = User.User;
    _professor = Professor.Professor;
    _course = Course.Course;
    _student = Student.Student;
    _userService = UserService;
  }

  getAllProfessors = catchServiceAsync(async (page = 1, limit = 10) => {
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    const data = await _professor.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      include: [
        {
          model: _user,
          as: "user",
          attributes: ["id", "name", "email"],
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
          user: {
            id: professor.user.id,
            name: professor.user.name,
            email: professor.user.email,
          },
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
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!professor) {
      throw new AppError("Professor not found", 404);
    }

    return { data: professor };
  });

  getProfessorCourses = catchServiceAsync(async (professorId) => {
    const professor = await _professor.findByPk(professorId, {
      include: [
        {
          model: _course,
          as: "courses",
          include: [
            {
              model: _student,
              as: "students",
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!professor) {
      throw new AppError("Professor not found", 404);
    }

    const coursesWithStudentCount = professor.courses.map((course) => ({
      course_name: course.course_name,
      course_number: course.course_number,
      student_count: course.students.length,
    }));

    const totalCourses = professor.courses.length;

    const totalStudents = professor.courses.reduce(
      (acc, course) => acc + course.students.length,
      0
    );

    return {
      data: {
        professor_name: professor.name,
        total_courses: totalCourses,
        total_students: totalStudents,
        courses: coursesWithStudentCount,
      },
    };
  });

  createProfessor = catchServiceAsync(async (body) => {
    body.role = "professor";
    const {
      name,
      username,
      email,
      password,
      cedula,
      status,
      hourly_rate,
      phone,
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
    });

    return { data: professor };
  });

  updateProfessor = catchServiceAsync(async (id, body) => {
    const { email, cedula, status, hourly_rate, phone } = body;
    const professor = await _professor.findByPk(id);
    if (!professor) {
      throw new AppError("Professor not found", 404);
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
          as: "user",
          attributes: ["name", "username", "email", "status"],
        },
      ],
    });

    return { data: updatedProfessor };
  });

  deleteProfessor = catchServiceAsync(async (id) => {
    const professor = await _professor.findByPk(id);

    if (!professor) {
      throw new AppError("Professor not found", 404);
    }

    await _professor.destroy({ where: { id } });
    await _user.destroy({ where: { id: professor.user_id } });

    return {
      message: "Professor and associated user deleted successfully",
      data: {},
    };
  });
};
