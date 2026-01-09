const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class RolePermissionModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.RolePermission = _sequelize.define(
      'role_permission',
      {
        role_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          primaryKey: true,
        },
        permission_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          primaryKey: true, 
        },
      },
      {
        tableName: 'role_permission',
        timestamps: false,
      }
    );
  }
};