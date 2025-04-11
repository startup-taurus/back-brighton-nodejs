const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class StudentModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Student = _sequelize.define(
      'student',
      {
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'user',
            key: 'id',
          },
        },
        cedula: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        level_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'level',
            key: 'id',
          },
        },
        profession: {
          type: DataTypes.STRING,
        },
        book_given: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        age_category: {
          type: DataTypes.STRING,
        },
        birth_date: {
          type: DataTypes.DATE,
        },
        phone_number: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        observations: {
          type: DataTypes.TEXT,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status_level_change: {
          type: DataTypes.ENUM('n/a', 'pending', 'approved', 'rejected'),
          defaultValue: 'n/a',
        },
        promotion: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        pending_payments: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        emergency_contact_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        emergency_contact_phone: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        emergency_contact_relationship: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: 'student',
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.Student.sync();
  }
};
