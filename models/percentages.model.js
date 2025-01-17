const { DataTypes } = require("sequelize");
let _sequelize = null;

module.exports = class PercentagesModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Percentages = _sequelize.define(
      "percentages",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        min: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
        },
        max: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
        },
        syllabus_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "syllabus",
            key: "id",
          },
          allowNull: false,
        },
      },
      {
        tableName: "percentages",
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.Percentages.sync();
  }
};
