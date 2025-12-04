const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');

let _roleService = null;

module.exports = class RoleController extends BaseController {
  constructor({ RoleService }) {
    super(RoleService);
    _roleService = RoleService;
  }

  getAllRoles = catchControllerAsync(async (req, res) => {
    const result = await _roleService.getAll();
    return appResponse(res, result);
  });

  updateRole = catchControllerAsync(async (req, res) => {
    const { role } = req.params;
    const { name, status } = req.body;
    const result = await _roleService.updateOne(role, { name, status });
    return appResponse(res, result);
  });

  createRole = catchControllerAsync(async (req, res) => {
    const { name, status } = req.body;
    const result = await _roleService.createOne({ name, status });
    return appResponse(res, result);
  });
};