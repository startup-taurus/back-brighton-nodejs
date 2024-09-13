const { DataTypes } = require("sequelize");
let _sequelize = null;
let _professor = null;

module.exports = class CourseModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
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
        end_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        course_type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        hourly_rate: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        schedule: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        professor_id: {
          type: DataTypes.INTEGER,
          references: {
            model: _professor,
            key: "id",
          },
          allowNull: false,
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
