
const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class StudentTransfer {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.StudentTransfer = _sequelize.define(
      'student_transfer',
      {
        student_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'student',
            key: 'id',
          },
        },
        transfer_data_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'transfer_data',
            key: 'id',
          },
        },
      },
      {
        tableName: 'student_transfer',
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.StudentTransfer.sync();
  }
};
