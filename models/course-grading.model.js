const { DataTypes } = require("sequelize");
let _sequelize = null;

module.exports = class CourseGradingModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel(Sequelize);
  }

  defineModel() {
    this.CourseGrading = _sequelize.define(
      "course_grading",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        course_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "course",
            key: "id",
          },
          allowNull: false,
        },
        grading_item_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "grading_items",
            key: "id",
          },
          allowNull: false,
        },
        weight: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
        },
      },
      {
        tableName: "course_grading",
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.CourseGrading.sync();
  }
};
