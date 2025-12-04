const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
let _permissionsService = null;

module.exports = class PermissionsController extends BaseController {
  constructor({ PermissionsService }) {
    super(PermissionsService);
    _permissionsService = PermissionsService;
  }

  syncPermissions = catchControllerAsync(async (req, res) => {
    const result = await _permissionsService.syncPermissions(req.body);
    return appResponse(res, result);
  });

  getRoles = catchControllerAsync(async (req, res) => {
    const result = await _permissionsService.getAllRoles();
    return appResponse(res, result);
  });

  getMyPermissions = catchControllerAsync(async (req, res) => {
    const result = await _permissionsService.getPermissionsForUser(req.user);
    return appResponse(res, result);
  });

  getPermissionsByRole = catchControllerAsync(async (req, res) => {
    const { role } = req.params;
    const result = await _permissionsService.getPermissionsByRole(role);
    return appResponse(res, result);
  });

  updatePermissionsByRole = catchControllerAsync(async (req, res) => {
    const { role } = req.params;
    const { permissions } = req.body;
    const result = await _permissionsService.setPermissionsByRole(role, permissions || []);
    return appResponse(res, result);
  });
};