const { DataTypes } = require('sequelize');
let _sequelize = null;

module.exports = class LevelModel {
  constructor({ Sequelize }) {
    _sequelize = Sequelize;
    this.defineModel();
  }

  defineModel() {
    this.Level = _sequelize.define(
      'level',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        full_level: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        short_level: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
      },
      {
        tableName: 'level',
        timestamps: false,
      }
    );
  }

  syncModel() {
    return this.Level.sync();
  }
};
