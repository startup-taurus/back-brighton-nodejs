const { DataTypes } = require('sequelize');
let _sequelize = null;
module.exports = class UserModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }
  defineModel() {
    this.User = _sequelize.define(
      'user',
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        first_name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        middle_name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        last_name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        second_last_name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        username: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        role_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
        },
        image: {
          type: DataTypes.STRING,
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: 'active',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        last_login: {
          type: DataTypes.DATE,
        },
        failed_attempts: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
      },
      {
        tableName: 'user',
        timestamps: false,
      }
    );
  }
  syncModel() {
    return this.User.sync();
  }
};
