const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const AppError = require("../utils/app-error");
const { validateParameters } = require("../utils/utils");
let _student = null;
module.exports = class StudentService extends BaseService {
  constructor({ Student }) {
    super(Student);
    _student = Student.Student;
  }

  getAllStudents = catchServiceAsync(async (page, limit) => {
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);
    const data = await _student.findAndCountAll({
      limitNumber,
      offset: limitNumber * (pageNumber - 1),
    });
    return {
      data: {
        result: data.rows,
        totalCount: data.count,
      },
    };
  });

  getStudent = catchServiceAsync(async (id) => {
    const student = await _student.findByPk(id);
    if (!student) {
      throw new AppError("Student not found", 404);
    }
    return { data: student };
  });

  createStudent = catchServiceAsync(async (body) => {
    const { name, cedula, lastName, courseId, level, status } = body;
    validateParameters({ name, cedula, lastName, courseId, level, status });

    body.last_name = lastName;
    body.book_given = body.bookGiven;
    body.course_id = parseInt(courseId);
    body.pending_payments = body.pendingPayments;

    delete body.lastName;
    delete body.bookGiven;
    delete body.courseId;
    delete body.pendingPayments;

    const student = await _student.create(body);

    return { data: student };
  });

  updateStudent = catchServiceAsync(async (id, body) => {
    body.last_name = body.lastName;
    body.book_given = body.bookGiven;
    body.course_id = parseInt(body.courseId);
    body.pending_payments = body.pendingPayments;

    delete body.lastName;
    delete body.bookGiven;
    delete body.courseId;
    delete body.pendingPayments;

    const student = await _student.update(body, { where: { id } });
    return { data: student };
  });

  deleteStudent = catchServiceAsync(async (id) => {
    const student = await _student.destroy({ where: { id } });
    return { data: student };
  });
};
