const AppError = require("./app-error");

module.exports = {
  validateParameters(params, customMessage) {
    for (const [key, value] of Object.entries(params)) {
      if (!value) {
        let message =
          customMessage ||
          `Los datos no se enviaron correctamente, es posible que falte el parámetro ${key}`;
        throw new AppError(message, 400);
      }
    }
  },
};
