//* Clase de excepción personalizada para los errores de validación
class ValidationError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

//* Función para manejar respuestas HTTP
const handleHttpResponse = (res, statusCode, title, status, message, totalCount, data) => {
  if (!res || statusCode === undefined || !status || totalCount === undefined || !data) {
    return res.status(500).json({ error: "Parámetros inválidos para la respuesta." });
  }
  const response = {
    status,
    code: statusCode,
    title,
    message,
    totalCount,
    data,
  };
  return res.status(statusCode).json(response);
};

//* Función para crear respuestas exitosas
exports.success = ({res, statusCode = 200, title = "Success", message = "Success", totalCount = 0, data = [], status = "success"}) => {
  return handleHttpResponse(res, statusCode, title, status, message, totalCount, data);
};

//* Función para crear respuestas de error
exports.error = ({res, statusCode = 500, title = "Error", message = "Internal Server Error", totalCount = 0, data = [], status = "error"}) => {
  return handleHttpResponse(res, statusCode, title, status, message, totalCount, data);
};

//* Función para crear respuestas de validación
exports.validation = ({res, statusCode = 400, title = "Validation Error", message = "Invalid Request", totalCount = 0, data = [], status = "info"}) => {
  return handleHttpResponse(res, statusCode, title, status, message, totalCount, data);
};

exports.handleHttpResponse = handleHttpResponse;
exports.ValidationError = ValidationError; 