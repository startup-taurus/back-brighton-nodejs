const { DataTypes } = require("sequelize");
let _sequelize = null;

module.exports = class GradePercentagesModel {
    constructor({ Sequelize }) {
      _sequelize = Sequelize;
      this.defineModel();
    }
  
    defineModel() {
      this.GradePercentages = _sequelize.define(
        "grade_percentages",
        {
          id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          syllabus_id: {
            type: DataTypes.INTEGER,
            references: {
              model: "syllabus",
              key: "id",
            },
            allowNull: false,
          },
          assig_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
          },
          test_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
          },
          exam_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
          },
        },
        {
          tableName: "grade_percentages",
          timestamps: false,
        }
      );
    }
  
    syncModel() {
      return this.GradePercentages.sync();
    }
  };
  