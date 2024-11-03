const { DataTypes } = require("sequelize");
let _sequelize = null;

module.exports = class HolidaysModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Holidays = _sequelize.define(
      "holidays",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        holiday_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        holiday_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        holiday_type: {
          type: DataTypes.ENUM("national", "regional", "local"),
          defaultValue: "national",
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          onUpdate: DataTypes.NOW,
        },
      },
      {
        tableName: "holidays",
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.Holidays.sync();
  }
};
