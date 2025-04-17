const { Op } = require('sequelize');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters } = require('../utils/utils');
const catchServiceAsync = require('../utils/catch-service-async');
let _user = null;
let _course = null;
let _authUtils = null;
let _professor = null;

module.exports = class UserService extends BaseService {
  constructor({ User, Course, AuthUtils, Professor }) {
    super(User);
    _user = User.User;
    _course = Course.Course;
    _professor = Professor.Professor;
    _authUtils = AuthUtils;
  }

  login = catchServiceAsync(async (username, password) => {
    validateParameters({ username, password });

    let user = await _user.findOne({
      where: { username: username },
      raw: true,
    });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.failed_attempts >= 5) {
      throw new AppError(
        'Account is locked due to too many failed login attempts',
        403
      );
    }

    const isPasswordValid = await _authUtils.comparePassword(
      password,
      user.password
    );
    delete user.password;

    if (!isPasswordValid) {
      await _user.update(
        { failed_attempts: user.failed_attempts + 1 },
        { where: { id: user.id } }
      );
      throw new AppError('Password incorrect', 400);
    }

    await _user.update(
      {
        failed_attempts: 0,
        last_login: new Date(),
      },
      { where: { id: user.id } }
    );

    if (user.role === 'professor') {
      let professor = await _professor.findOne({
        where: { user_id: user.id },
        attributes: ['report_link'],
        raw: true,
      });
      user.report_link = professor?.report_link;
    }

    return { data: user, message: null };
  });

  getAllUsers = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10, ...filters } = query;

    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    const trimmedQuery = {
      ...query,
      status: query.status?.trim(),
      user_type: query.user_type?.trim(),
      username: query.username?.trim(),
      name: query.name?.trim(),
    };
    console.log(query.user_type);

    let where = {};
    filters?.status && (where.status = trimmedQuery.status);
    filters?.user_type && (where.role = trimmedQuery.user_type);
    filters?.username &&
      (where.username = { [Op.like]: `%${trimmedQuery.username}%` });
    filters?.name && (where.name = { [Op.like]: `%${trimmedQuery.name}%` });

    const data = await _user.findAndCountAll({
      where,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      attributes: { exclude: ['password'] },
      order: [['id', 'DESC']],
    });

    return {
      data: {
        result: data.rows,
        totalCount: data.count,
      },
    };
  });

  getUser = catchServiceAsync(async (id) => {
    const user = await _user.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return { data: user };
  });

  createUser = catchServiceAsync(async (body) => {
    const { name, username, email, password, role, status } = body;
    validateParameters({ name, role, status });

    const hashedPassword = await _authUtils.hashPassword(body.password);
    body.password = hashedPassword;

    const user = await _user.create(body);
    return { data: user };
  });

  updateUser = catchServiceAsync(async (id, body) => {
    const { name, username, email, password, role, status } = body;
    validateParameters({ name, username, email, role, status });

    const updateData = { name, username, email, role, status };

    if (password) {
      const hashedPassword = await _authUtils.hashPassword(password);
      updateData.password = hashedPassword;
    }

    const user = await _user.update(updateData, { where: { id } });
    return { data: user };
  });

  updateUserStatus = catchServiceAsync(async (id, body) => {
    const { status } = body;
    validateParameters({ id, status });
    const user = await _user.update({ status }, { where: { id } });
    return { data: user };
  });

  deleteUser = catchServiceAsync(async (id) => {
    const user = await _user.destroy({ where: { id } });
    return { data: user };
  });

  getDashboardData = catchServiceAsync(async () => {
    const professors = await _user.count({ where: { role: 'professor' } });
    const students = await _user.count({ where: { role: 'student' } });
    const courses = await _course.count();
    const schoolCardData = [
      {
        header: 'Total Teachers',
        amount: professors,
        amountClass: 'secondary',
        imageName: 'icon-2.svg',
      },
      {
        header: 'Total Students',
        amount: students,
        amountClass: 'success',
        imageName: 'icon4.svg',
      },
      {
        header: 'Total Courses',
        amount: courses,
        amountClass: 'warning',
        imageName: 'icon-3.svg',
      },
    ];
    return { data: schoolCardData };
  });
};
