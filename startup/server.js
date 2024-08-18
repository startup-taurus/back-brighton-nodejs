const express = require("express");
const http = require("http");
let _express = null;
let _config = null;
let _server = null;
module.exports = class Server {
  constructor({
    config,
    router,
  }) {
    _config = config;
    _express = express().use(router);
    _server = http.createServer(_express);
  }
  start() {
    return new Promise((resolve) => {
      _server.listen(_config.PORT, async () => {
        console.log(
          `${_config.APPLICATION_NAME} on port ${_config.PORT} ${_config.API_URL} `
        );
      });
      resolve();
    });
  }
};
