const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters, generateCredentials } = require('../utils/utils');
const { or, Op } = require('sequelize');
const { filter } = require('lodash');
let _user = null;
let _student = null;
let _course = null;
let _payment = null;
let _courseStudent = null;
let _userService = null;
let _professor = null;

module.exports = class StudentService extends BaseService {
  constructor({
    User,
    Student,
    Course,
    Payment,
    CourseStudent,
    UserService,
    Professor,
  }) {
    super(Student);
    _user = User.User;
    _student = Student.Student;
    _course = Course.Course;
    _payment = Payment.Payment;
    _courseStudent = CourseStudent.CourseStudent;
    _userService = UserService;
    _professor = Professor.Professor;
  }

  getAllStudents = async (query) => {
    const { page = 1, limit = 10, ...filters } = query;

    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    const trimmedQuery = {
      ...query,
      status: query.status?.trim(),
      promotion: query.promotion?.trim(),
      level: query.level?.trim(),
      cedula: query.cedula?.trim(),
    };

    // Get all students with basic info
    const data = await _student.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      where: {
        ...(filters.status && { status: trimmedQuery.status }),
        ...(filters.promotion && {
          promotion: { [Op.like]: `%${trimmedQuery.promotion}%` },
        }),
        ...(filters.level && {
          level: { [Op.like]: `%${trimmedQuery.level}%` },
        }),
        ...(filters.cedula && {
          cedula: { [Op.like]: `%${trimmedQuery.cedula}%` },
        }),
      },
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['id', 'name', 'email', 'status', 'username', 'password'],
        },
        {
          model: _payment,
          as: 'payment',
          attributes: ['payment_date', 'total_payment', 'payment_method'],
        },
      ],
      order: [['id', 'DESC']],
    });

    // Prepare an array to hold our formatted student data
    let formattedRows = data?.rows?.map((row) => row.toJSON());

    // For each student, get their two most recent courses separately
    for (const student of formattedRows) {
      const courseStudents = await _courseStudent.findAll({
        where: { student_id: student.id },
        limit: 2,
        include: [
          {
            model: _course,
            as: 'course',
            where: { ...(query.course && { id: query.course }) },
            required: false,
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
            ],
          },
        ],
        order: [['enrollment_date', 'DESC']],
      });

      // Map course students to the format we need
      student.course = courseStudents
        .map((cs) => {
          const courseJson = cs.toJSON();
          return {
            id: courseJson.course?.id,
            course_student_id: courseJson.id,
            course_name: courseJson.course?.course_name,
            course_number: courseJson.course?.course_number,
            professor: courseJson.course?.professor?.user?.name,
            enrollment_date: courseJson.enrollment_date,
          };
        })
        .filter((c) => c.id); // Filter out any potential nulls
    }

    return {
      data: {
        result: formattedRows.map((student) => ({
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
          age_category: student.age_category,
          birth_date: student.birth_date,
          user: {
            id: student.user.id,
            name: student.user.name,
            email: student.user.email,
            status: student.user.status,
            username: student.user.username,
          },
          course: student.course || [],
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
  };

  getStudent = catchServiceAsync(async (id) => {
    const student = await _student.findByPk(id, {
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!student) {
      throw new AppError('Student not found', 404);
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
        age_category: student.age_category,
        birth_date: student.birth_date,
        user: {
          id: student.user.id,
          name: student.user.name,
          email: student.user.email,
        },
      },
    };
  });

  createStudent = catchServiceAsync(async (body) => {
    body.role = 'student';
    const {
      name,
      cedula,
      profession,
      courseId,
      level,
      status,
      book_given,
      pending_payments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      promotion,
      age_category,
      birth_date,
    } = body;
    validateParameters({
      name,
      cedula,
      status,
      course: courseId,
    });

    const { username, password } = generateCredentials(name, cedula);
    body.username = username;
    body.password = password;

    const userResponse = await _userService.createUser(body);

    const user = userResponse.data;

    const student = await _student.create({
      user_id: user.id,
      cedula,
      profession,
      level,
      status,
      book_given,
      age_category,
      birth_date,
      pending_payments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      promotion,
    });

    if (courseId) {
      await _courseStudent.create({
        course_id: parseInt(courseId),
        student_id: student.id,
        enrollment_date: new Date(),
      });
    }

    return { data: student };
  });

  updateStudent = catchServiceAsync(async (id, body) => {
    body.role = 'student';
    const {
      cedula,
      level,
      status,
      promotion,
      book_given,
      pending_payments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      age_category,
      birth_date,
      courseId,
    } = body;

    // const courseExist = await _courseStudent.count({
    //   where: { course_id: courseId, student_id: id },
    // });

    // if (courseExist === 0) {
    await _courseStudent.create({
      course_id: parseInt(courseId),
      student_id: id,
      enrollment_date: new Date(),
    });
    // }

    const student = await _student.findByPk(id);

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    await _userService.updateUser(student.user_id, body);

    await _student.update(
      {
        cedula,
        level,
        status,
        book_given,
        pending_payments,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        promotion,
        age_category,
        birth_date,
      },
      { where: { id } }
    );

    const updatedStudent = await _student.findByPk(id, {
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['name', 'username', 'email', 'status'],
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
      throw new AppError('Student not found', 404);
    }

    await _student.destroy({ where: { id } });
    await _user.destroy({ where: { id: student.user_id } });

    return { message: 'Student and associated user deleted successfully' };
  });
};
