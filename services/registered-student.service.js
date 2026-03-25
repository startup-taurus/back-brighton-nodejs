const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters } = require('../utils/utils');
const sendEmail = require('../utils/email.utils');
const { Op } = require('sequelize');
const { AGE_CATEGORY, ERROR_MESSAGES } = require('../utils/constants');

let _registeredStudent = null;
let _level = null;
let _student = null;

module.exports = class RegisteredStudentService extends BaseService {
  constructor({ RegisteredStudent, Level, Student }) {
    super(RegisteredStudent);
    _registeredStudent = RegisteredStudent.RegisteredStudent;
    _level = Level.Level;
    _student = Student.Student;
  }

  getAllRegisteredStudents = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10, ...filters } = query;

    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    const trimmedQuery = {
      ...query,
      level_id: query.level_id?.trim(),
      id_number: query.id_number?.trim(),
    };

    let where = {};

    filters?.level_id && (where.level_id = trimmedQuery.level_id);

    filters?.id_number &&
      (where.id_number = { [Op.like]: `%${trimmedQuery.id_number}%` });

    const data = await _registeredStudent.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      where,
      order: [['id', 'DESC']],
      include: [
        {
          model: _level,
          as: 'level',
          attributes: ['id', 'full_level'],
        },
      ],
    });

    const formattedRows = data.rows.map((row) => {
      const student = row.toJSON();
      return {
        id: student.id,
        first_name: student.first_name,
        middle_name: student.middle_name,
        last_name: student.last_name,
        second_last_name: student.second_last_name,
        id_number: student.id_number,
        birthday: student.birthday,
        phone_number: student.phone_number,
        email: student.email,
        address: student.address,
        emergency_contact_name: student.emergency_contact_name,
        emergency_contact_phone: student.emergency_contact_phone,
        emergency_contact_relationship: student.emergency_contact_relationship,
        age_category: student.age_category,
        level_id: student.level_id,

        level: student.level
          ? {
              id: student.level.id,
              name: student.level.full_level,
            }
          : null,
        same_billing: student.same_billing,
        billing_address: student.billing_address,
        where_hear_about_us: student.where_hear_about_us,
        schedule: student.schedule,
      };
    });

    return {
      data: {
        result: formattedRows,
        totalCount: data.count,
      },
    };
  });

  getStudent = catchServiceAsync(async (id) => {
    const student = await _registeredStudent.findByPk(id, {
      include: [
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

    const studentTransfer = student.toJSON();

    return {
      data: {
        id: studentTransfer.id,
        first_name: studentTransfer.first_name,
        middle_name: studentTransfer.middle_name,
        last_name: studentTransfer.last_name,
        second_last_name: studentTransfer.second_last_name,
        id_number: studentTransfer.id_number,
        birthday: studentTransfer.birthday,
        phone_number: studentTransfer.phone_number,
        email: studentTransfer.email,
        address: studentTransfer.address,
        emergency_contact_name: studentTransfer.emergency_contact_name,
        emergency_contact_phone: studentTransfer.emergency_contact_phone,
        emergency_contact_relationship: studentTransfer.emergency_contact_relationship,
        age_category: studentTransfer.age_category,
        level_id: studentTransfer.level_id,
        level: studentTransfer.level
          ? {
              id: studentTransfer.level.id,
              name: studentTransfer.level.full_level,
            }
          : null,
        same_billing: studentTransfer.same_billing,
        billing_address: studentTransfer.billing_address,
        schedule: studentTransfer.schedule,
        where_hear_about_us: studentTransfer.where_hear_about_us,
      },
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
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      age_category,
      level_id,
      same_billing,
      billing_address,
      where_hear_about_us,
      birthday,
      schedule,
    } = body;

    const normalizedIdNumber = id_number?.trim();

    const validationParams = {
      first_name,
      middle_name,
      last_name,
      second_last_name,
      id_number: normalizedIdNumber,
      phone_number,
      email,
      address,
      age_category,
      level_id,
      birthday,
      schedule,
    };

    if (age_category === AGE_CATEGORY.KIDS) {
      validationParams.emergency_contact_name = emergency_contact_name;
      validationParams.emergency_contact_phone = emergency_contact_phone;
      validationParams.emergency_contact_relationship =
        emergency_contact_relationship;
    }

    validateParameters(validationParams);

    const [existingRegisteredStudent, existingStudent] = await Promise.all([
      _registeredStudent.findOne({
        where: { id_number: normalizedIdNumber },
        attributes: ['id', 'id_number'],
        raw: true,
      }),
      _student.findOne({
        where: { cedula: normalizedIdNumber },
        attributes: ['id', 'cedula'],
        raw: true,
      }),
    ]);

    if (existingRegisteredStudent || existingStudent) {
      throw new AppError(ERROR_MESSAGES.CEDULA_ALREADY_REGISTERED, 400);
    }

    const student = await _registeredStudent.create({
      first_name,
      middle_name,
      last_name,
      second_last_name,
      id_number: normalizedIdNumber,
      phone_number,
      email,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      age_category,
      level_id,
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
      \nEmergency Contact: ${emergency_contact_name}, Phone: ${emergency_contact_phone}, Relationship: ${emergency_contact_relationship}
      \nAge Category: ${age_category}, Level ID: ${level_id},
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
      level_id,
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
        level_id,
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
