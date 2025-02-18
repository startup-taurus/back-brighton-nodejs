const { DataTypes } = require("sequelize");

module.exports = class ProfessorModel {
  constructor({ Sequelize, User }) {
    this.sequelize = Sequelize;
    this.User = User; // Referencia al modelo de 'user'
    this.defineModel();
  }

  defineModel() {
    this.Professor = this.sequelize.define(
      "professor",
      {
        user_id: {
          type: DataTypes.INTEGER,
          references: {
            model: this.User, // Relación con la tabla 'user'
            key: "id",
          },
          allowNull: false,
        },
        cedula: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: "active",
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        phone: {
          type: DataTypes.STRING,
        },
        hourly_rate: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        report_link: {
          type: DataTypes.TEXT,
        },
        created_at: {
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
    return this.Professor.sync();
  }
};
