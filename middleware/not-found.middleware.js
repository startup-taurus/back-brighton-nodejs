module.exports = (req, res, next) =>
  res.status(404).send({
    statusCode: 404,
    status: "fail",
    message: "Resource not found",
    data: {},
  });
