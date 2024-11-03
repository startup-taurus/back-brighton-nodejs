const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const AppError = require("../utils/app-error");
const { validateParameters } = require("../utils/utils");
let _user = null;
let _authUtils = null;
module.exports = class UserService extends BaseService {
  constructor({ User, AuthUtils }) {
    super(User);
    _user = User.User;
    _authUtils = AuthUtils;
  }

  login = catchServiceAsync(async (username, password) => {
    validateParameters({ username, password });

    const user = await _user.findOne({ where: { username: username } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.failed_attempts >= 5) {
      throw new AppError(
        "Account is locked due to too many failed login attempts",
        403
      );
    }

    const isPasswordValid = await _authUtils.comparePassword(
      password,
      user.password
    );
    delete user.dataValues.password;

    if (!isPasswordValid) {
      await user.update({ failed_attempts: user.failed_attempts + 1 });
      throw new AppError("Password incorrect", 400);
    }

    await user.update({
      failed_attempts: 0,
      last_login: new Date(),
    });

    return { data: user };
  });

  getAllUsers = catchServiceAsync(async (page = 1, limit = 10) => {
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);
    const data = await _user.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      attributes: { exclude: ["password"] },
      order: [["id", "DESC"]],
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
      throw new AppError("User not found", 404);
    }
    return { data: user };
  });

  createUser = catchServiceAsync(async (body) => {
    const { name, username, email, password, role, status } = body;
    validateParameters({ name, username, email, password, role, status });

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
};
