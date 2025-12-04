const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class RoleModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Role = _sequelize.define(
      'role',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(100),
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
          field: 'is_active' 
        },
      },
      {
        tableName: 'role',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }
};