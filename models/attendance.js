const { DataTypes } = require("sequelize");
let _sequelize = null;

module.exports = class AttendanceModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Attendance = _sequelize.define(
      "attendance",
      {
        course_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "course",
            key: "id",
          },
          allowNull: false,
        },
        student_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "student",
            key: "id",
          },
          allowNull: false,
        },
        attendance_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("Present", "Absent", "Excused"),
          allowNull: false,
        },
      },
      {
        tableName: "attendance",
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.Attendance.sync();
  }
};
