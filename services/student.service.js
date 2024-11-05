const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const AppError = require("../utils/app-error");
const { validateParameters } = require("../utils/utils");
const { or } = require("sequelize");
let _user = null;
let _student = null;
let _course = null;
let _payment = null;
let _courseStudent = null;
let _userService = null;

module.exports = class StudentService extends BaseService {
  constructor({ User, Student, Course, Payment, CourseStudent, UserService }) {
    super(Student);
    _user = User.User;
    _student = Student.Student;
    _course = Course.Course;
    _payment = Payment.Payment;
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
          attributes: ["id", "name", "email", "status", "username", "password"],
        },
        {
          model: _payment,
          as: "payment",
          attributes: ["payment_date", "total_payment", "payment_method"],
        },
        {
          model: _course,
          as: "course",
          through: { attributes: [] },
          attributes: ["id", "course_name", "course_number"],
        },
      ],
      order: [["id", "DESC"]],
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
          pending_payments: student.pending_payments,
          profession: student.profession,
          book_given: student.book_given,
          promotion: student.promotion,
          user: {
            id: student.user.id,
            name: student.user.name,
            email: student.user.email,
            status: student.user.status,
            username: student.user.username,
          },
          course: Array.isArray(student.course)
            ? student.course.map((course) => ({
                id: course.id,
                course_name: course.course_name,
                course_number: course.course_number,
              }))
            : [],
          payments: Array.isArray(student.payment)
            ? student.payment.map((payment) => ({
                payment_date: payment.payment_date,
                total_payment: payment.total_payment,
                payment_method: payment.payment_method,
              }))
            : [],
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
      profession,
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
      courseId,
      level,
      status,
    });

    const userResponse = await _userService.createUser(body);

    const user = userResponse.data;

    const student = await _student.create({
      user_id: user.id,
      cedula,
      profession,
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
    body.role = "student";
    const {
      cedula,
      level,
      status,
      promotion,
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

    await _userService.updateUser(student.user_id, body);

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
        promotion
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

  updateStudentStatus = catchServiceAsync(async (id, body) => {
    const { status } = body;
    validateParameters({ id, status });
    const student = await _student.update({ status }, { where: { id } });
    return { data: student };
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
