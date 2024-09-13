const { DataTypes } = require("sequelize");
let _sequelize = null;
let _student = null;

module.exports = class PaymentModel {
  constructor({ Sequelize, Student }) {
    _sequelize = Sequelize;
    _student = Student;
    this.defineModel();
  }
  defineModel() {
    this.Payment = _sequelize.define(
      "payment",
      {
        payment_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        payment_method: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        total_payment: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        hours_charged: {
          type: DataTypes.DECIMAL(5, 2),
          defaultValue: 0,
        },
        observations: {
          type: DataTypes.TEXT,
        },
        student_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: _student,
            key: 'id',
          },
        },
      },
      {
        tableName: "payment",
        timestamps: false,
      }
    );
  }
  syncModel() {
    return this.Payment.sync();
  }
};
