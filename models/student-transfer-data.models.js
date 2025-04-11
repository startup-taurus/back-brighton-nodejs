// models/StudentTransferData.js
const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class StudentTransferData {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.StudentTransferData = _sequelize.define(
      'student_transfer_data',
      {
        student_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'student',
            key: 'id',
          },
        },
        selected_course_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        selected_level_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        status_level_change: {
          type: DataTypes.ENUM('pending', 'approved', 'n/a'),
          defaultValue: 'pending',
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: 'student_transfer_data',
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.StudentTransferData.sync();
  }
};
