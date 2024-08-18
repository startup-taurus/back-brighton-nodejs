const { DataTypes } = require("sequelize");

module.exports = class Professor {
  constructor({ Sequelize }) {
    this.sequelize = Sequelize;
    this.defineModel();
  }
  defineModel() {
    Professor = this.sequelize.define(
      "Professor",
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        phone: {
          type: DataTypes.STRING,
        },
        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: "professor",
        timestamps: false,
      }
    );
  }
  syncModel() {
    return this.Audit.sync();
  }
};
