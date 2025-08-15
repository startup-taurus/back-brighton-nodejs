const { DataTypes } = require("sequelize");
let _sequelize = null;
let _professor = null;

module.exports = class CourseModel {
  constructor({ Sequelize, Professor }) {
    _sequelize = Sequelize;
    _professor = Professor;
    this.defineModel();
  }

  defineModel() {
    this.Course = _sequelize.define(
      "Course",
      {
        course_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        course_number: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        start_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: null,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        course_type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        age_group: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        classroom: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        hourly_rate: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          defaultValue: null,
        },
        total_hours: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        schedule: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        professor_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "professor",
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
          allowNull: true,
        },
      },
      {
        tableName: "course",
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.Course.sync();
  }
};
