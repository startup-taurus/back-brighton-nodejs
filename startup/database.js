const { Sequelize } = require("sequelize");
let _server = null;
let _sequelize = null;
module.exports = class Database {
  constructor({ Server, Sequelize }) {
    _server = Server;
    _sequelize = Sequelize;
  }

  connect() {
    _sequelize
      .authenticate()
      .then(() => {
        console.log("Connected to MySQL database");
        _server.start();
      })
      .catch((err) => {
        console.error("Error connecting to MySQL:", err);
      });
  }
};
