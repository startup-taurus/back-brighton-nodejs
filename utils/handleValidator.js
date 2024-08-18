const { validationResult } = require("express-validator");
const { validation, error } = require("../utils/handleHttpResponse");

const validateResults = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return validation({
        res,
        statusCode: 422,
        totalCount: errorMessages.length,
        message: errorMessages,
        status: "warning",
      });
    }
    return next();
  } catch (err) {
    return error({ res });
  }
};

module.exports = validateResults;
