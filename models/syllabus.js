const { DataTypes } = require("sequelize");
let _sequelize = null;

module.exports = class SyllabusModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Syllabus = _sequelize.define(
      "syllabus",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        syllabus_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
      },
      {
        tableName: "syllabus",
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.Syllabus.sync();
  }
};
