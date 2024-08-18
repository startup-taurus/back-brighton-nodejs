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
    const isPasswordValid = await _authUtils.comparePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError("Password incorrect", 400);
    }
    return { data: user };
  });

  getAllUsers = catchServiceAsync(async (page = 1, limit = 10) => {
    validateParameters({ page, limit });
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);
    const data = await _user.findAndCountAll({
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

  getUser = catchServiceAsync(async (id) => {
    const user = await _user.findOne({ where: { id: id } });
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
    validateParameters({ name, username, email, password, role, status });
    const user = await _user.update(
      { name, username, email, password, role, status },
      { where: { id } }
    );
    return { data: user };
  });

  deleteUser = catchServiceAsync(async (id) => {
    const user = await _user.destroy({ where: { id } });
    return { data: user };
  });
};
