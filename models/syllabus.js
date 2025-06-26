const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class SyllabusModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Syllabus = _sequelize.define(
      'syllabus',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        syllabus_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        level_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'level',
            key: 'id',
          },
        },
        exam_type: {
          type: DataTypes.ENUM('STARTERS', 'MOVERS', 'FLYERS', 'KEY', 'PRELIM', 'FIRST'),
          allowNull: true,
          defaultValue: 'PRELIM.',
        },
      },
      {
        tableName: 'syllabus',
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.Syllabus.sync();
  }
};
