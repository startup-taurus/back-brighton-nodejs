const {Op} = require('sequelize');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const {deleteFile} = require('../utils/upload');
const {validateParameters, validateEmailFormat} = require('../utils/utils');
const catchServiceAsync = require('../utils/catch-service-async');
const {USER_TYPES, ERROR_MESSAGES} = require('../utils/constants');
let _user = null;
let _course = null;
let _authUtils = null;
let _professor = null;
let _student = null;
let _sequelize = null;

module.exports = class UserService extends BaseService {
  constructor({User, Course, AuthUtils, Professor, Student, Sequelize}) {
    super(User);
    _user = User.User;
    _course = Course.Course;
    _professor = Professor.Professor;
    _student = Student.Student;
    _authUtils = AuthUtils;
    _sequelize = Sequelize;
  }

  login = catchServiceAsync(async (username, password) => {
    validateParameters({username, password});

    let user = await _user.findOne({
      where: {
        [Op.or]: [
          _sequelize.where(
            _sequelize.fn('BINARY', _sequelize.col('username')),
            username
          ),
          _sequelize.where(
            _sequelize.fn('BINARY', _sequelize.col('email')),
            username
          ),
        ],
      },
      raw: true,
    });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.failed_attempts >= 5) {
      throw new AppError(
        'Account has been locked due to 5 failed login attempts. Please contact support to unlock your account.',
        403
      );
    }

    const isPasswordValid = await _authUtils.comparePassword(
      password,
      user.password
    );
    delete user.password;

    if (!isPasswordValid) {
      const newFailedAttempts = user.failed_attempts + 1;
      const updateData = {failed_attempts: newFailedAttempts};
      if (newFailedAttempts >= 5) {
        updateData.status = 'inactive';
      }

      await _user.update(updateData, {where: {id: user.id}});

      if (newFailedAttempts >= 5) {
        throw new AppError(
          'Account has been locked due to 5 failed login attempts. Please contact support to unlock your account.',
          403
        );
      }
      const remainingAttempts = 5 - newFailedAttempts;
      const errorMessage = `Password incorrect. Failed attempts: ${newFailedAttempts}/5. Remaining attempts: ${remainingAttempts}`;
      const error = new AppError(errorMessage, 400);
      error.failedAttempts = newFailedAttempts;
      error.remainingAttempts = remainingAttempts;
      throw error;
    }

    await _user.update(
      {
        failed_attempts: 0,
        last_login: new Date(),
      },
      {where: {id: user.id}}
    );

    if (user.role === USER_TYPES.PROFESSOR) {
      let professor = await _professor.findOne({
        where: {user_id: user.id},
        attributes: ['report_link'],
        raw: true,
      });
      user.report_link = professor?.report_link;
    }

    const token = _authUtils.generateToken(user.id);

    return {data: {...user, token}, message: null};
  });

  getAllUsers = catchServiceAsync(async (query) => {
    const {page = 1, limit = 10, ...filters} = query;

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
      (where.username = {[Op.like]: `%${trimmedQuery.username}%`});
    filters?.name && (where.name = {[Op.like]: `%${trimmedQuery.name}%`});

    const data = await _user.findAndCountAll({
      where,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      attributes: {exclude: ['password']},
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
    return {data: user};
  });

  validateDuplicateUser = catchServiceAsync(
    async (email, username, excludeUserId = null) => {
      validateParameters({email, username});

      const emailValidation = validateEmailFormat(email);
      if (!emailValidation.isValid) {
        throw new AppError(emailValidation.message, 400);
      }

      const [existingEmailUser, existingUsernameUser] = await Promise.all([
        _user.findOne({
          where: {
            [Op.and]: [
              _sequelize.where(
                _sequelize.fn('BINARY', _sequelize.col('email')),
                email
              ),
              ...(excludeUserId ? [{id: {[Op.ne]: excludeUserId}}] : []),
            ],
          },
          attributes: ['id', 'email'],
          raw: true,
        }),
        _user.findOne({
          where: {
            [Op.and]: [
              _sequelize.where(
                _sequelize.fn('BINARY', _sequelize.col('username')),
                username
              ),
              ...(excludeUserId ? [{id: {[Op.ne]: excludeUserId}}] : []),
            ],
          },
          attributes: ['id', 'username'],
          raw: true,
        }),
      ]);

      if (existingEmailUser) {
        throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED, 400);
      }

      if (existingUsernameUser) {
        throw new AppError(ERROR_MESSAGES.USERNAME_ALREADY_REGISTERED, 400);
      }
    }
  );

  validateDuplicateByRole = catchServiceAsync(
    async (email, cedula, role, username = null, excludeUserId = null) => {
      validateParameters({email, cedula});

      const emailValidation = validateEmailFormat(email);
      if (!emailValidation.isValid) {
        throw new AppError(emailValidation.message, 400);
      }

      const validationConfig = {
        email: {
          query: () =>
            _user.findOne({
              where: {
                [Op.and]: [
                  _sequelize.where(
                    _sequelize.fn('BINARY', _sequelize.col('email')),
                    email
                  ),
                  ...(excludeUserId ? [{id: {[Op.ne]: excludeUserId}}] : []),
                ],
              },
              attributes: ['id', 'email'],
              raw: true,
            }),
          errorKey: 'EMAIL_ALREADY_REGISTERED',
        },
        username: {
          query: () =>
            _user.findOne({
              where: {
                [Op.and]: [
                  _sequelize.where(
                    _sequelize.fn('BINARY', _sequelize.col('username')),
                    username
                  ),
                  ...(excludeUserId ? [{id: {[Op.ne]: excludeUserId}}] : []),
                ],
              },
              attributes: ['id', 'username'],
              raw: true,
            }),
          errorKey: 'USERNAME_ALREADY_REGISTERED',
          condition: () => !!username,
        },
        cedula: {
          query: () =>
            _professor.findOne({
              where: {
                cedula: cedula,
                ...(excludeUserId && {user_id: {[Op.ne]: excludeUserId}}),
              },
              attributes: ['id', 'cedula'],
              raw: true,
            }),
          errorKey: 'CEDULA_ALREADY_REGISTERED',
          condition: () => role === USER_TYPES.PROFESSOR,
        },
      };

      const activeValidations = Object.entries(validationConfig)
        .filter(([key, config]) => !config.condition || config.condition())
        .map(([key, config]) => ({key, ...config}));

      const queries = activeValidations.map((validation) => validation.query());
      const results = await Promise.all(queries);

      const duplicates = activeValidations
        .map((validation, index) => ({
          key: validation.key,
          errorKey: validation.errorKey,
          isDuplicate: !!results[index],
        }))
        .filter((item) => item.isDuplicate);

      if (duplicates.length > 0) {
        const errorKeys = duplicates.map((d) => d.errorKey).sort();
        const errorKeyString = errorKeys.join('_');

        const errorMessageMap = {
          EMAIL_ALREADY_REGISTERED: ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED,
          USERNAME_ALREADY_REGISTERED:
            ERROR_MESSAGES.USERNAME_ALREADY_REGISTERED,
          CEDULA_ALREADY_REGISTERED: ERROR_MESSAGES.CEDULA_ALREADY_REGISTERED,
          CEDULA_ALREADY_REGISTERED_EMAIL_ALREADY_REGISTERED:
            ERROR_MESSAGES.EMAIL_CEDULA_ALREADY_REGISTERED,
          EMAIL_ALREADY_REGISTERED_USERNAME_ALREADY_REGISTERED:
            ERROR_MESSAGES.EMAIL_USERNAME_ALREADY_REGISTERED,
          CEDULA_ALREADY_REGISTERED_USERNAME_ALREADY_REGISTERED:
            ERROR_MESSAGES.CEDULA_USERNAME_ALREADY_REGISTERED,
          CEDULA_ALREADY_REGISTERED_EMAIL_ALREADY_REGISTERED_USERNAME_ALREADY_REGISTERED:
            ERROR_MESSAGES.EMAIL_CEDULA_USERNAME_ALREADY_REGISTERED,
        };

        const message =
          errorMessageMap[errorKeyString] ||
          ERROR_MESSAGES.DUPLICATE_DATA_FOUND;
        throw new AppError(message, 400);
      }
    }
  );

  createUser = catchServiceAsync(
    async (
      body,
      file,
      skipValidation = false,
      skipRoleSpecificCreation = false
    ) => {
      const {name, username, email, password, role, status} = body;

      if (role === USER_TYPES.STUDENT || role === USER_TYPES.PROFESSOR) {
        validateParameters({name, username, email, role, status});
      } else {
        validateParameters({name, role, status});
      }

      if (!skipValidation) {
        await this.validateDuplicateUser(email, username);
      }

      const hashedPassword = await _authUtils.hashPassword(password);
      const userData = {...body, password: hashedPassword};

      if (file) {
        userData.image = file.filename;
      }

      const user = await _user.create(userData);

      if (!skipRoleSpecificCreation) {
        if (role === USER_TYPES.PROFESSOR) {
          await _professor.create({
            user_id: user.id,
            cedula: body.cedula || '',
            status: status || 'active',
            email: email,
            phone: body.phone || '',
            hourly_rate: 0,
            report_link: body.report_link || '',
          });
        }

        if (role === USER_TYPES.STUDENT) {
          await _student.create({
            user_id: user.id,
            cedula: body.cedula || '',
            level_id: body.level_id || 1,
            profession: body.profession || '',
            book_given: false,
            age_category: body.age_category || '',
            birth_date: body.birth_date || null,
            phone_number: body.phone_number || '',
            observations: body.observations || '',
            status: status,
            promotion: body.promotion || '',
            pending_payments: false,
            emergency_contact_name: body.emergency_contact_name || '',
            emergency_contact_phone: body.emergency_contact_phone || '',
            emergency_contact_relationship:
              body.emergency_contact_relationship || '',
          });
        }
      }

      return {data: user};
    }
  );

  updateUser = catchServiceAsync(async (id, body, file) => {
    const {
      name,
      first_name,
      middle_name,
      last_name,
      second_last_name,
      username,
      email,
      password,
      role,
      status,
    } = body;
    validateParameters({name, username, email, role, status});

    await this.validateDuplicateUser(email, username, id);

    const currentUser = await _user.findByPk(id);
    if (!currentUser) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const updateData = {name, username, email, role, status};

    const nameFields = {first_name, middle_name, last_name, second_last_name};
    Object.entries(nameFields).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    if (file) {
      if (currentUser.image) {
        deleteFile(currentUser.image);
      }
      updateData.image = file.filename;
    }

    if (password) {
      const hashedPassword = await _authUtils.hashPassword(password);
      updateData.password = hashedPassword;
    }

    const user = await _user.update(updateData, {where: {id}});
    return {data: user};
  });

  updateUserStatus = catchServiceAsync(async (id, body) => {
    const {status} = body;
    validateParameters({id, status});
    const user = await _user.update({status}, {where: {id}});
    return {data: user};
  });

  resetFailedAttempts = catchServiceAsync(async (id) => {
    validateParameters({id});

    const user = await _user.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const result = await _user.update(
      {
        failed_attempts: 0,
        status: 'active',
      },
      {where: {id}}
    );
    return {
      data: result,
      message: 'User activated and failed attempts reset successfully',
    };
  });

  deleteUser = catchServiceAsync(async (id) => {
    const user = await _user.destroy({where: {id}});
    return {data: user};
  });

  getDashboardData = catchServiceAsync(async () => {
    const professors = await _professor.count({
      where: {
        status: 'active',
      },
      include: [
        {
          model: _user,
          as: 'user',
          required: true,
          where: {
            status: 'active',
            role: 'professor',
          },
        },
      ],
    });

    const students = await _student.count({
      where: {
        status: 'active',
      },
      include: [
        {
          model: _user,
          as: 'user',
          required: true,
          where: {
            status: 'active',
          },
        },
        {
          model: _course,
          as: 'courses',
          required: true,
          where: {
            status: 'active',
          },
          through: {
            where: {
              is_retired: false,
            },
          },
        },
      ],
      distinct: true,
    });

    const courses = await _course.count({
      where: {
        status: 'active',
      },
    });

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
    return {data: schoolCardData};
  });
};
