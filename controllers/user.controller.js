const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
let _userService = null;
module.exports = class UserController extends BaseController {
  constructor({ UserService }) {
    super(UserService);
    _userService = UserService;
  }

  signIn = catchControllerAsync(async (req, res) => {
    const { username, password } = req.body;
    const result = await _userService.login(username, password);
    return appResponse(res, result);
  });

  getMe = catchControllerAsync(async (req, res, next) => {
    const user = req.user;
    req.query.id = user.id;
    next();
  });

  getAllUsers = catchControllerAsync(async (req, res) => {
    const result = await _userService.getAllUsers(req.query);
    return appResponse(res, result);
  });

  getUser = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _userService.getUser(id);
    return appResponse(res, result);
  });

  createUser = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const result = await _userService.createUser(body);
    return appResponse(res, result);
  });

  updateUser = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const { id } = req.params;
    const result = await _userService.updateUser(id, body);
    return appResponse(res, result);
  });

  updateUserStatus = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const { id } = req.params;
    const result = await _userService.updateUserStatus(id, body);
    return appResponse(res, result);
  });

  deleteUser = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _userService.deleteUser(id);
    return appResponse(res, result);
  });

  getFullUser = catchControllerAsync(async (req, res) => {
    const { id } = req.query;
    const result = await _userService.getUser(id);
    return appResponse(res, result);
  });

  getDashboardData = catchControllerAsync(async (req, res) => {
    const result = await _userService.getDashboardData();
    return appResponse(res, result);
  });
};
