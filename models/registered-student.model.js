const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class RegisteredStudent {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.RegisteredStudent = _sequelize.define(
      'registered_student',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        first_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        middle_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        last_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        second_last_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        id_number: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        birthday: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        phone_number: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        email: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        emergency_contact_name: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        emergency_contact_phone: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        emergency_contact_relationship: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        age_category: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        level_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'level',
            key: 'id',
          },
        },
        schedule: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        same_billing: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        billing_address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        where_hear_about_us: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        tableName: 'registered_student',
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.RegisteredStudent.sync();
  }
};
