// models/transfer_data.js
const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class TransferData {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.TransferData = _sequelize.define(
      'transfer_data',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        selected_course_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'course',
            key: 'id',
          },
        },
        selected_level_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'level',
            key: 'id',
          },
        },
        status_level_change: {
          type: DataTypes.ENUM('pending', 'approved', 'rejected', 'n/a'),
          defaultValue: 'n/a',
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true, 
        },
        is_group: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        created_by_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'user',
            key: 'id',
          },
        },
      },
      {
        tableName: 'transfer_data',
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.TransferData.sync();
  }
};
