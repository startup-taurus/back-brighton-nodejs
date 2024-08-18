class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.data = {};
    if (typeof message === "string") {
      this.message = message;
    } else if (typeof message === "object") {
      this.message = message;
    }
    this.isOperation = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
