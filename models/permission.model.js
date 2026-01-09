const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class PermissionModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Permission = _sequelize.define(
      'permission',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        module_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false,
        },
        identifier: {
          type: DataTypes.STRING(150),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        status: {
          type: DataTypes.TINYINT,
          defaultValue: 1,
          allowNull: false,
        },
      },
      {
        tableName: 'permission',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }
};