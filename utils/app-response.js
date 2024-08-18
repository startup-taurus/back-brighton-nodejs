exports.appResponse = (
  res,
  {
    statusCode = 200,
    status = "success",
    message = "Successfully received data",
    data = {},
  }
) => res.status(statusCode).send({ statusCode, status, message, data });
