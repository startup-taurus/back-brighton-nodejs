const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const { Op } = require('sequelize');
const { PERMISSIONS } = require('../utils/permissions');

let _role = null;
let _permission = null;
let _rolePermission = null;
let _sequelize = null;

module.exports = class PermissionsService extends BaseService {
  constructor({ Role, Permission, RolePermission, Sequelize }) {
    super();
    _role = Role.Role ? Role.Role : Role;
    _permission = Permission.Permission ? Permission.Permission : Permission;
    _rolePermission = RolePermission.RolePermission ? RolePermission.RolePermission : RolePermission;
    _sequelize = Sequelize;
  }

  getAllRoles = catchServiceAsync(async () => {
    try {
      const roles = await _role.findAll({
        attributes: ['id', 'name', 'status', 'created_at', 'updated_at'],
        order: [['id', 'ASC']]
      });
      return { data: roles };
    } catch (error) {
      console.error(error);
      return { data: [] };
    }
  });

  getPermissionsByRole = catchServiceAsync(async (roleName) => {
    try {
      const roleRecord = await _role.findOne({ where: { name: roleName } });
      if (!roleRecord) return { data: [], created_at: null, updated_at: null };

      const rolePermissionRecords = await _rolePermission.findAll({
        where: { role_id: roleRecord.id },
        attributes: ['permission_id']
      });

      if (!rolePermissionRecords.length) {
        return { data: [], created_at: roleRecord.created_at, updated_at: roleRecord.updated_at };
      }

      const permissionIds = rolePermissionRecords.map(rp => rp.permission_id);
      const permissions = await _permission.findAll({
        where: { id: { [Op.in]: permissionIds } },
        attributes: ['identifier'],
        order: [['identifier', 'ASC']]
      });

      return {
        data: permissions.map(p => p.identifier),
        created_at: roleRecord.created_at,
        updated_at: roleRecord.updated_at
      };
    } catch (error) {
      console.error(error);
      return { data: [], created_at: null, updated_at: null };
    }
  });

  getPermissionsForUser = catchServiceAsync(async (user) => {
    let roleName = user?.role_info?.name || null;
    if (!roleName && user?.role_id) {
      const roleRecord = await _role.findByPk(user.role_id, { attributes: ['name'] });
      roleName = roleRecord?.name || null;
    }
    if (!roleName && typeof user?.role === 'string' && user.role) {
      roleName = user.role;
    }
    if (!roleName) return { data: [] };
    return this.getPermissionsByRole(roleName);
  });

  setPermissionsByRole = catchServiceAsync(async (roleName, permissionIdentifiers) => {
    if (!roleName || !Array.isArray(permissionIdentifiers)) {
      return { data: [], message: 'Invalid payload' };
    }

    const transaction = await _sequelize.transaction();

    try {
      const normalizedRole = String(roleName).trim().toLowerCase();
      if (normalizedRole === 'professor') {
        const allowed = new Set([
          'view_dashboard',
          'view_courses',
          'view_syllabus',
          'view_attendance',
          'mark_attendance',
          'view_gradebook',
          'add_grades',
          'edit_grades',
          'view_holidays',
          'view_cancelled_lessons',
          'create_cancelled_lesson',
          'view_student_reports',
          'create_student_report',
          'edit_student_report',
        ]);
        permissionIdentifiers = permissionIdentifiers.filter(p => allowed.has(p));
      }

      const roleRecord = await _role.findOne({ where: { name: roleName }, transaction });
      if (!roleRecord) {
        await transaction.rollback();
        return { statusCode: 404, status: 'fail', message: `Role '${roleName}' not found`, data: [] };
      }

      let permissionIds = [];
      if (permissionIdentifiers.length > 0) {
        const found = await _permission.findAll({
          where: { identifier: { [Op.in]: permissionIdentifiers } },
          attributes: ['id'],
          transaction
        });
        permissionIds = found.map(p => p.id);
      }

      await _rolePermission.destroy({ where: { role_id: roleRecord.id }, transaction });

      if (permissionIds.length > 0) {
        const payload = permissionIds.map(permId => ({ role_id: roleRecord.id, permission_id: permId }));
        await _rolePermission.bulkCreate(payload, { transaction });
      }

      const now = new Date();
      await _role.update({ updated_at: now }, { where: { id: roleRecord.id }, transaction });

      await transaction.commit();
      return { data: permissionIdentifiers, updated_at: now };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  syncPermissions = catchServiceAsync(async () => {
    const identifiers = Object.values(PERMISSIONS);
    const now = new Date();

    const MODULES_ORDER = [
      'Dashboard', 'Students', 'Professors', 'Courses', 'Syllabus',
      'Attendance', 'Gradebook', 'Holidays', 'Users', 'Payments',
      'FinancialReports', 'StudentReports'
    ];

    const MODULE_RULES = [
      { key: 'dashboard', module: 'Dashboard' },
      { key: 'student_report', module: 'StudentReports' },
      { key: 'student', module: 'Students' },
      { key: 'transfer', module: 'Students' },
      { key: 'teacher', module: 'Professors' },
      { key: 'cancelled_lesson', module: 'Holidays' },
      { key: 'course', module: 'Courses' },
      { key: 'syllabus', module: 'Syllabus' },
      { key: 'attendance', module: 'Attendance' },
      { key: 'gradebook', module: 'Gradebook' },
      { key: 'grade', module: 'Gradebook' },
      { key: 'holiday', module: 'Holidays' },
      { key: 'user', module: 'Users' },
      { key: 'payment', module: 'Payments' },
      { key: 'financial', module: 'FinancialReports' },
    ];

    const getModuleId = (identifier) => {
      const s = String(identifier).toLowerCase();
      const found = MODULE_RULES.find(r => s.includes(r.key));
      const moduleName = found ? found.module : 'Dashboard';
      const idx = MODULES_ORDER.indexOf(moduleName);
      return idx >= 0 ? idx + 1 : 2;
    };

    const toTitle = (slug) => slug.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

    return await _sequelize.transaction(async (transaction) => {
      const existing = await _permission.findAll({ attributes: ['id', 'identifier'], transaction });
      const existsMap = new Set(existing.map(e => e.identifier));

      const operations = identifiers.map(identifier => {
        const module_id = getModuleId(identifier);
        const name = toTitle(identifier);
        
        if (existsMap.has(identifier)) {
          return _permission.update(
            { name, module_id, status: 1, updated_at: now },
            { where: { identifier }, transaction }
          );
        }
        return _permission.create(
          { name, module_id, identifier, description: null, status: 1 },
          { transaction }
        );
      });

      await Promise.all(operations);
      return { data: identifiers.length, message: 'Permissions synced successfully' };
    });
  });
};
