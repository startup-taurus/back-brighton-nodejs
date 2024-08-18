const AppError = require("./app-error");

module.exports = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      throw new AppError(err.message, err.statusCode);
    }
  };
};
