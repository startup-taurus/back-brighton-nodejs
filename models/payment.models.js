const { DataTypes } = require("sequelize");
let _sequelize = null;
let _Student = null;
module.exports = class PaymentModel {
  constructor({ Sequelize, Student }) {
    _sequelize = Sequelize;
    _Student = Student;
    this.defineModel();
  }
  defineModel() {
    this.Payment = _sequelize.define(
      "Payment",
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
      },
      {
        tableName: "payment",
        timestamps: false,
      }
    );
    this.Payment.belongsTo(_Student.Student, { foreignKey: "student_id" });
  }
  syncModel() {
    return this.Payment.sync();
  }
};
