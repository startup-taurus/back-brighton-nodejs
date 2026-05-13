const express = require("express");
const http = require("http");
const fixPrematurelyCompletedCourses = require("../utils/fix-prematurely-completed-courses");
let _express = null;
let _config = null;
let _server = null;
module.exports = class Server {
  constructor({ config, router, Association, Sequelize }) {
    _config = config;
    _express = express().use(router);
    _server = http.createServer(_express);
    this._sequelize = Sequelize;
  }
  start() {
    return new Promise((resolve) => {
      _server.listen(_config.PORT, async () => {
        console.log(
          `${_config.APPLICATION_NAME} on port ${_config.PORT} ${_config.API_URL} `
        );
        fixPrematurelyCompletedCourses({ apply: true, sequelize: this._sequelize })
          .catch((err) =>
            console.error("[fix-completed] startup task failed:", err.message)
          );
      });
      resolve();
    });
  }
};
