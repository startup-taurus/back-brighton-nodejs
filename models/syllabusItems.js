const { DataTypes } = require("sequelize");
let _sequelize = null;

module.exports = class SyllabusItemsModel {
    constructor({ Sequelize }) {
      _sequelize = Sequelize;
      this.defineModel();
    }
  
    defineModel() {
      this.SyllabusItems = _sequelize.define(
        "syllabus_items",
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
          item_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
          },
        },
        {
          tableName: "syllabus_items",
          timestamps: false,
        }
      );
    }
  
    syncModel() {
      return this.SyllabusItems.sync();
    }
  };
  