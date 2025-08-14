const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class PrivateClassHoursModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.PrivateClassHours = _sequelize.define(
      'private_class_hours',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        student_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'student',
            key: 'id',
          },
          allowNull: false,
        },
        course_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'course',
            key: 'id',
          },
          allowNull: false,
        },
        lesson_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        hours: {
          type: DataTypes.DECIMAL(3, 1),
          defaultValue: 1.0,
          allowNull: false,
        },
        topic: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        lesson_status: {
          type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
          defaultValue: 'PENDING',
          allowNull: false,
        },
      },
      {
        tableName: 'private_class_hours',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  syncModel() {
    return this.PrivateClassHours.sync();
  }
};