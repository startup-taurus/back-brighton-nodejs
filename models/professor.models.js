const { DataTypes } = require("sequelize");

module.exports = class ProfessorModel {
  constructor({ Sequelize }) {
    this.sequelize = Sequelize;
    this.defineModel();
  }
  defineModel() {
    this.Professor = this.sequelize.define(
      "Professor",
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        cedula: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: "active",
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        phone: {
          type: DataTypes.STRING,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: "professor",
        timestamps: false,
      }
    );
  }
  syncModel() {
    return this.Professor.sync();
  }
};
