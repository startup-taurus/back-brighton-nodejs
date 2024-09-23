const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const AppError = require("../utils/app-error");
const { validateParameters } = require("../utils/utils");
let _user = null;
let _student = null;
let _course = null;
let _courseStudent = null;
let _userService = null;

module.exports = class StudentService extends BaseService {
  constructor({ User, Student, Course, CourseStudent, UserService }) {
    super(Student);
    _user = User.User;
    _student = Student.Student;
    _course = Course.Course;
    _courseStudent = CourseStudent.CourseStudent;
    _userService = UserService;
  }

  getAllStudents = catchServiceAsync(async (page = 1, limit = 10) => {
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    const data = await _student.findAndCountAll({
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
        result: data.rows.map((student) => ({
          id: student.id,
          cedula: student.cedula,
          level: student.level,
          status: student.status,
          observations: student.observations,
          emergency_contact_name: student.emergency_contact_name,
          emergency_contact_phone: student.emergency_contact_phone,
          emergency_contact_relationship:
            student.emergency_contact_relationship,
          user: {
            id: student.user.id,
            name: student.user.name,
            email: student.user.email,
          },
        })),
        totalCount: data.count,
      },
    };
  });

  getStudent = catchServiceAsync(async (id) => {
    const student = await _student.findByPk(id, {
      include: [
        {
          model: _user,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    return {
      data: {
        id: student.id,
        cedula: student.cedula,
        level: student.level,
        status: student.status,
        observations: student.observations,
        emergency_contact_name: student.emergency_contact_name,
        emergency_contact_phone: student.emergency_contact_phone,
        emergency_contact_relationship: student.emergency_contact_relationship,
        user: {
          id: student.user.id,
          name: student.user.name,
          email: student.user.email,
        },
      },
    };
  });

  createStudent = catchServiceAsync(async (body) => {
    body.role = "student";
    const {
      name,
      username,
      email,
      password,
      cedula,
      lastName,
      courseId,
      level,
      status,
      bookGiven,
      pendingPayments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
    } = body;

    validateParameters({
      name,
      username,
      email,
      password,
      cedula,
      lastName,
      courseId,
      level,
      status,
    });

    const userResponse = await _userService.createUser(body);

    const user = userResponse.data;

    const student = await _student.create({
      user_id: user.id,
      cedula,
      last_name: lastName,
      level,
      status,
      book_given: bookGiven,
      pending_payments: pendingPayments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
    });

    await _courseStudent.create({
      course_id: parseInt(courseId),
      student_id: student.id,
      enrollment_date: new Date(),
    });

    return { data: student };
  });

  updateStudent = catchServiceAsync(async (id, body) => {
    const {
      name,
      username,
      email,
      cedula,
      level,
      status,
      bookGiven,
      pendingPayments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
    } = body;

    const student = await _student.findByPk(id);

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    await _userService.updateUser(student.user_id, {
      name,
      username,
      email,
      status,
    });

    await _student.update(
      {
        cedula,
        level,
        status,
        book_given: bookGiven,
        pending_payments: pendingPayments,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
      },
      { where: { id } }
    );

    const updatedStudent = await _student.findByPk(id, {
      include: [
        {
          model: _user,
          as: "user",
          attributes: ["name", "username", "email", "status"],
        },
      ],
    });

    return { data: updatedStudent };
  });

  deleteStudent = catchServiceAsync(async (id) => {
    const student = await _student.findByPk(id);

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    await _student.destroy({ where: { id } });
    await _user.destroy({ where: { id: student.user_id } });

    return { message: "Student and associated user deleted successfully" };
  });
};
