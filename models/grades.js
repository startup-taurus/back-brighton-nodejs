const { DataTypes } = require("sequelize");
let _sequelize = null;

module.exports = class GradesModel {
  constructor({ Sequelize}) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Grades = _sequelize.define(
      "grades",
      {
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
        grade: {
          type: DataTypes.DECIMAL(4, 2),
          allowNull: false,
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        tableName: "grades",
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.Grades.sync();
  }
};
