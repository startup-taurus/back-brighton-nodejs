const errorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;

  error.message = `${error.statusCode}`.startsWith(4)
    ? error.message
    : 'An internal server error has occurred. Please contact the administrator.';

  res.status(error.statusCode).json({
    statusCode: error.statusCode,
    status: error.status,
    message: error.message,
    data: error.data,
    // stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = errorHandler;
