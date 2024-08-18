const { DataTypes } = require("sequelize");
let _sequelize = null;
module.exports = class StudentModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }
  defineModel() {
    this.Student = _sequelize.define(
      "student",
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
        last_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        level: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        profession: {
          type: DataTypes.STRING,
        },
        book_given: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        observations: {
          type: DataTypes.TEXT,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        pending_payments: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: "student",
        timestamps: false,
      }
    );
  }
  syncModel() {
    return this.Student.sync();
  }
};
