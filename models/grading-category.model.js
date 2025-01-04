const { DataTypes } = require("sequelize");
let _sequelize = null;
module.exports = class GradingCategoryModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel(Sequelize);
  }

  defineModel() {
    this.GradingCategory = _sequelize.define(
      "grading_category",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
      },
      {
        tableName: "grading_categories",
        timestamps: false,
      }
    );
  }
  syncModel() {
    return this.GradingCategory.sync();
  }
};
