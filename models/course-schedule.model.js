const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class CourseScheduleModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.CourseSchedule = _sequelize.define(
      'course_schedule',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        course_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'course',
            key: 'id',
          },
          allowNull: false,
        },
        syllabus_item_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'syllabus_items',
            key: 'id',
          },
          allowNull: false,
        },
        scheduled_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        lesson_taught: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        tableName: 'course_schedule',
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.CourseSchedule.sync();
  }
};
