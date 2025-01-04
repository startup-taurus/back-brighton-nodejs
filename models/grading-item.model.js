const { DataTypes } = require("sequelize");
let _sequelize = null;

module.exports = class GradingItemModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel(Sequelize);
  }

  defineModel() {
    this.GradingItem = _sequelize.define(
      "grading_item",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        category_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "grading_categories",
            key: "id",
          },
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
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
      },
      {
        tableName: "grading_items",
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.GradingItem.sync();
  }
};
