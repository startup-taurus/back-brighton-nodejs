const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class HolidaysModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.CancelledLesson = _sequelize.define(
      'cancelled_lesson',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        cancel_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        cancel_reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        course_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'course',
            key: 'id',
          },
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          onUpdate: DataTypes.NOW,
        },
      },
      {
        tableName: 'cancelled_lesson',
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.CancelledLesson.sync();
  }
};
