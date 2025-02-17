const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class AttendanceModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Attendance = _sequelize.define(
      'attendance',
      {
        course_schedule_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'course_schedule',
            key: 'id',
          },
          allowNull: false,
        },
        student_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'student',
            key: 'id',
          },
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('present', 'absent', 'late', 'recovered'),
          allowNull: false,
        },
      },
      {
        tableName: 'attendance',
        timestamps: true,
      }
    );
  }

  syncModel() {
    return this.Attendance.sync();
  }
};
