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
let _level = null;
let _studentTransferData = null;

module.exports = class StudentService extends BaseService {
  constructor({
    User,
    Student,
    Course,
    Payment,
    CourseStudent,
    UserService,
    Professor,
    Level,
    StudentTransferData,
  }) {
    super(Student);
    _user = User.User;
    _student = Student.Student;
    _course = Course.Course;
    _payment = Payment.Payment;
    _courseStudent = CourseStudent.CourseStudent;
    _userService = UserService;
    _professor = Professor.Professor;
    _level = Level.Level;
    _studentTransferData = StudentTransferData.StudentTransferData;
  }

  getAllStudents = async (query) => {
    const { page = 1, limit = 10, ...filters } = query;

    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    const trimmedQuery = {
      ...query,
      status: query.status?.trim(),
      promotion: query.promotion?.trim(),
      level_id: query.level_id,
      cedula: query.cedula?.trim(),
      name: query.name?.trim(),
      status_level_change: query.status_level_change?.trim(),
    };

    let studentIds = [];
    if (query.course) {
      const courseStudents = await _courseStudent.findAll({
        where: { course_id: query.course },
        attributes: ['student_id'],
        raw: true,
      });
      studentIds = courseStudents.map((cs) => cs.student_id);

      if (studentIds.length === 0) {
        return {
          data: {
            result: [],
            totalCount: 0,
          },
        };
      }
    }

    const data = await _student.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      where: {
        ...(filters.status && { status: trimmedQuery.status }),
        ...(filters.promotion && {
          promotion: { [Op.like]: `%${trimmedQuery.promotion}%` },
        }),
        ...(filters.level_id && {
          level_id: trimmedQuery.level_id,
        }),
        ...(filters.cedula && {
          cedula: { [Op.like]: `%${trimmedQuery.cedula}%` },
        }),
        ...(filters.status_level_change && {
          status_level_change: trimmedQuery.status_level_change,
        }),
        ...(studentIds.length > 0 && { id: { [Op.in]: studentIds } }),
      },
      include: [
        {
          model: _user,
          as: 'user',
          ...(filters.name && {
            where: {
              name: { [Op.like]: `%${trimmedQuery.name}%` },
            },
          }),
          attributes: ['id', 'name', 'email', 'status', 'username', 'password'],
        },
        {
          model: _payment,
          as: 'payment',
          attributes: ['payment_date', 'total_payment', 'payment_method'],
        },
        {
          model: _level,
          as: 'level',
          attributes: ['id', 'full_level'],
        },
      ],
      order: [['id', 'DESC']],
    });

    let formattedRows = data?.rows?.map((row) => row.toJSON());

    for (const student of formattedRows) {
      const courseStudents = await _courseStudent.findAll({
        where: {
          student_id: student.id,
          ...(query.course && { course_id: query.course }),
        },
        limit: 2,
        include: [
          {
            model: _course,
            as: 'course',
            required: true,
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
        .filter((c) => c.id);
    }

    return {
      data: {
        result: formattedRows.map((student) => ({
          id: student.id,
          cedula: student.cedula,
          phone_number: student.phone_number,
          level_id: student.level_id,
          level: student.level
            ? {
                id: student.level.id,
                name: student.level.full_level,
              }
            : null,
          status: student.status,
          status_level_change: student.status_level_change,
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
          attributes: ['id', 'name', 'email', 'status', 'username'],
        },
        {
          model: _level,
          as: 'level',
          attributes: ['id', 'full_level'],
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
        phone_number: student.phone_number,
        level_id: student.level_id,
        level: student.level
          ? {
              id: student.level.id,
              name: student.level.full_level,
            }
          : null,
        status: student.status,
        status_level_change: student.status_level_change,
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

  getDistinctLevels = catchServiceAsync(async (query) => {
    // Ahora obtenemos los niveles directamente de la tabla levels
    const { page = 1, limit = 10 } = query;

    const limitNumber = parseInt(limit);
    const pageNumber = parseInt(page);

    // Utilizamos el servicio de Level para obtener todos los niveles
    const { count, rows } = await _level.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      order: [['full_level', 'ASC']],
    });

    return {
      data: {
        result: rows,
        totalCount: count,
      },
    };
  });

  // Método para solicitar una transferencia (usado por recepcionistas)
  requestTransferAndProgress = async (studentIds, courseId, levelId) => {
    try {
      // Verificar que al menos uno de los parámetros esté presente
      if (!courseId && !levelId) {
        throw new AppError(
          'Please provide either a course or a level to transfer students.',
          400
        );
      }

      const promises = [];

      // Para cada estudiante, creamos una solicitud de transferencia pendiente
      for (const studentId of studentIds) {
        // Actualizar el estado del estudiante a 'pending'
        await _student.update(
          { status_level_change: 'pending' },
          { where: { id: studentId } }
        );

        // Crear o actualizar el registro de transferencia
        const existingTransfer = await _studentTransferData.findOne({
          where: { student_id: studentId, status_level_change: 'pending' },
        });

        if (existingTransfer) {
          // Actualizar el registro existente
          promises.push(
            existingTransfer.update({
              selected_course_id:
                courseId || existingTransfer.selected_course_id,
              selected_level_id: levelId || existingTransfer.selected_level_id,
              updated_at: new Date(),
            })
          );
        } else {
          // Crear un nuevo registro
          promises.push(
            _studentTransferData.create({
              student_id: studentId,
              selected_course_id: courseId || null,
              selected_level_id: levelId || null,
              status_level_change: 'pending',
              created_at: new Date(),
              updated_at: new Date(),
            })
          );
        }
      }

      // Ejecutamos las promesas de forma paralela
      await Promise.all(promises);

      return {
        statusCode: 200,
        message: 'Transfer requests created successfully. Pending approval.',
      };
    } catch (error) {
      console.error('Error creating transfer requests:', error);
      throw new AppError('Error while creating transfer requests.', 500);
    }
  };

  // Método para ejecutar una transferencia (usado por coordinadores)
  transferAndProgressStudents = async (studentIds, courseId, levelId) => {
    try {
      // Verificar que al menos uno de los parámetros esté presente
      if (!courseId && !levelId) {
        throw new AppError(
          'Please provide either a course or a level to transfer students.',
          400
        );
      }

      const promises = [];

      // Si hay un nuevo curso, asignamos el curso a los estudiantes
      if (courseId) {
        promises.push(
          studentIds.map((studentId) => {
            return _courseStudent.create({
              student_id: studentId,
              course_id: courseId,
              enrollment_date: new Date(),
            });
          })
        );
      }

      // Si hay un nuevo nivel, actualizamos el nivel de los estudiantes y cambiamos el estado a 'approved'
      if (levelId) {
        promises.push(
          studentIds.map((studentId) => {
            return _student.update(
              {
                level_id: levelId,
                status_level_change: 'approved',
              },
              { where: { id: studentId } }
            );
          })
        );
      }

      // Actualizar los registros de transferencia a 'approved'
      for (const studentId of studentIds) {
        const transferRecord = await _studentTransferData.findOne({
          where: { student_id: studentId, status_level_change: 'pending' },
        });

        if (transferRecord) {
          promises.push(
            transferRecord.update({
              status_level_change: 'approved',
              updated_at: new Date(),
            })
          );
        }
      }

      // Ejecutamos las promesas de forma paralela
      await Promise.all(promises.flat());

      return {
        statusCode: 200,
        message: 'Students successfully transferred and/or progressed.',
      };
    } catch (error) {
      console.error('Error transferring/progressing students:', error);
      throw new AppError(
        'Error while transferring or progressing students.',
        500
      );
    }
  };

  createStudent = catchServiceAsync(async (body) => {
    body.role = 'student';
    const {
      name,
      cedula,
      courseId,
      level_id,
      profession,
      book_given,
      observations,
      status,
      pending_payments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      promotion,
      age_category,
      birth_date,
      phone_number,
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
      level_id,
      status,
      book_given,
      age_category,
      birth_date,
      pending_payments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      promotion,
      phone_number,
      observations,
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
      phone_number,
      level_id,
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

    await _courseStudent.create({
      course_id: parseInt(courseId),
      student_id: id,
      enrollment_date: new Date(),
    });

    const student = await _student.findByPk(id);

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    await _userService.updateUser(student.user_id, body);

    await _student.update(
      {
        cedula,
        phone_number,
        level_id,
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
