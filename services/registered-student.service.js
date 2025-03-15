const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters } = require('../utils/utils');
const sendEmail = require('../utils/email.utils');
const { Op } = require('sequelize');

let _registeredStudent = null;

module.exports = class RegisteredStudentService extends BaseService {
  constructor({ RegisteredStudent }) {
    super(RegisteredStudent);
    _registeredStudent = RegisteredStudent.RegisteredStudent;
  }

  getAllRegisteredStudents = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10, ...filters } = query;

    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    const trimmedQuery = {
      ...query,
      level: query.level?.trim(),
      id_number: query.id_number?.trim(),
    };

    let where = {};
    filters?.level && (where.level = trimmedQuery.level);
    filters?.id_number &&
      (where.id_number = { [Op.like]: `%${trimmedQuery.id_number}%` });

    const data = await _registeredStudent.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      where,
      order: [['id', 'DESC']],
    });

    return {
      data: {
        result: data.rows,
        totalCount: data.count,
      },
    };
  });

  getStudent = catchServiceAsync(async (id) => {
    const student = await _registeredStudent.findByPk(id);

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    return {
      data: student,
    };
  });

  createStudent = catchServiceAsync(async (body) => {
    const {
      first_name,
      middle_name,
      last_name,
      second_last_name,
      id_number,
      phone_number,
      email,
      address,
      age_category,
      level,
      same_billing,
      billing_address,
      where_hear_about_us,
      birthday,
      schedule,
    } = body;

    validateParameters({
      first_name,
      middle_name,
      last_name,
      second_last_name,
      id_number,
      phone_number,
      email,
      address,
      age_category,
      level,
      birthday,
      schedule,
    });

    const student = await _registeredStudent.create({
      first_name,
      middle_name,
      last_name,
      second_last_name,
      id_number,
      phone_number,
      email,
      address,
      age_category,
      level,
      same_billing,
      billing_address,
      birthday,
      schedule,
      where_hear_about_us,
    });

    await sendEmail({
      subject: 'Student Registration',
      text: `A Student has been registered with the following details: 
      \nName: ${first_name} ${middle_name} ${last_name} ${second_last_name}, ID: ${id_number}, 
      Birthday: ${birthday}, Schedule: ${schedule},
      \nPhone: ${phone_number}, Email: ${email}, Address: ${address} 
      \nAge Category: ${age_category}, Level: ${level},
      \nSame Billing: ${same_billing}, Billing Address ${
        same_billing === 'yes' ? address : billing_address
      },
      \nWhere did you hear about us: ${where_hear_about_us}`,
    });

    return { data: student };
  });

  updateStudent = catchServiceAsync(async (id, body) => {
    body.role = 'student';
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
      throw new AppError('Student not found', 404);
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
        promotion,
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

  deleteStudent = catchServiceAsync(async (id) => {
    const student = await _registeredStudent.findByPk(id);

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    await _registeredStudent.destroy({ where: { id } });

    return { message: 'Student and associated user deleted successfully' };
  });
};
