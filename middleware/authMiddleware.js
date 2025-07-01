const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { promisify } = require("util");
const AppError = require("../utils/app-error");

const protect = ({ User, config }) =>
  asyncHandler(async (req, res, next) => {
    let authorization = req.headers["authorization"];
    let token;
    if (authorization && authorization.startsWith("Bearer")) {
      token = authorization && authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("El token es invalido", 401));
    }

    try {
      const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);
      req.user = await User.User.findByPk(decoded.id);

      if (!req.user) {
        return next(new AppError("No existe el usuario", 404));
      }

      next();
    } catch (error) {
      if (error.message === "jwt malformed") {
        return next(new AppError("Token mal formado", 400));
      }

      console.log(error);
      return next(new AppError("Token inválido", 401));
    }
  });

const validateProfessorCourseAccess = ({ User, Course }) =>
  asyncHandler(async (req, res, next) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'admin_staff' || userRole === 'coordinator') {
      return next();
    }

    if (userRole === 'professor' && courseId) {
      const course = await Course.Course.findOne({
        where: { 
          id: courseId,
          professor_id: userId 
        }
      });

      if (!course) {
        return next(new AppError("No tienes acceso a este curso", 403));
      }
    }

    next();
  });

const routePermissions = {
  '/v1/api/transfer-data': ['admin_staff', 'coordinator'],
  '/v1/api/student-grades': ['admin_staff', 'coordinator', 'professor'],
  '/v1/api/course': ['admin_staff', 'coordinator', 'professor'],
  '/v1/api/student': ['admin_staff', 'coordinator', 'professor'],
  '/v1/api/professor': ['admin_staff', 'coordinator'],
  '/v1/api/attendance': ['admin_staff', 'coordinator', 'professor']
};

const checkPermissions = asyncHandler(async (req, res, next) => {
  const userRole = req.user?.role;
  const requestPath = req.baseUrl || req.route?.path || req.path;
  
  const allowedRoles = routePermissions[requestPath];
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return next(new AppError("No tienes permisos para acceder a este recurso", 403));
  }
  
  next();
});

module.exports = { 
  protect, 
  validateProfessorCourseAccess,
  checkPermissions 
};
