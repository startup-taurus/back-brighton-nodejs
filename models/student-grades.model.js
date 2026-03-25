const { DataTypes } = require("sequelize");
let _sequelize = null;
module.exports = class StudentGradesModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel(Sequelize);
  }

  defineModel() {
    this.StudentGrades = _sequelize.define(
      "student_grades",
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
        student_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "student",
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
        grade: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
        },
      },
      {
        tableName: "student_grades",
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.StudentGrades.sync();
  }
};
