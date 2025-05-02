const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class CourseStudentModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.CourseStudent = _sequelize.define(
      'courseStudent',
      {
        course_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'course',
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
        enrollment_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        observations: {
          type: DataTypes.TEXT,
        },
        is_retired: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        tableName: 'course_student',
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.CourseStudent.sync();
  }
};
