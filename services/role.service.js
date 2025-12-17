const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');

let _role = null;
let _user = null;
let _sequelize = null;

module.exports = class RoleService extends BaseService {
  constructor({ Role, User, Sequelize }) {
    super();
    _role = Role.Role ? Role.Role : Role;
    _user = User.User;
    _sequelize = Sequelize;
  }

  getAll = catchServiceAsync(async () => {
    const roles = await _role.findAll({
      attributes: ['id', 'name', 'status', 'created_at', 'updated_at'],
      order: [['id', 'ASC']],
    });
    return { data: roles };
  });

  updateOne = catchServiceAsync(async (currentName, payload) => {
    const { name, status } = payload || {};
    const transaction = await _sequelize.transaction();
    try {
      const roleRecord = await _role.findOne({ where: { name: currentName }, transaction });
      if (!roleRecord) return { statusCode: 404, status: 'fail', message: `Role '${currentName}' not found`, data: {} };

      const update = {};
      if (name && name !== roleRecord.name) {
        const exists = await _role.findOne({ where: { name }, transaction });
        if (exists) throw new Error(`Role name '${name}' already exists`);
        update.name = name;
      }

      if (typeof status !== 'undefined') {
        let s = status;
        if (typeof s === 'string') s = s.toLowerCase() === 'active' ? 1 : 0;
        update.status = s ? 1 : 0;
      }

      update.updated_at = new Date();
      await _role.update(update, { where: { id: roleRecord.id }, transaction });
      if (update.name) {
        await _user.update({ role: update.name }, { where: { role_id: roleRecord.id }, transaction });
      }
      await transaction.commit();
      return { data: { id: roleRecord.id, ...update } };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  createOne = catchServiceAsync(async ({ name, status }) => {
    if (!name) return { status: 'fail', message: 'Name is required', data: {} };
    const transaction = await _sequelize.transaction();
    try {
      const exists = await _role.findOne({ where: { name }, transaction });
      if (exists) throw new Error(`Role name '${name}' already exists`);
      let s = status;
      if (typeof s === 'string') s = s.toLowerCase() === 'active' ? 1 : 0;
      const created = await _role.create({ name, status: s ? 1 : 0 }, { transaction });
      await transaction.commit();
      return { data: created };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });
};