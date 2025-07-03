const asyncHandler = require('express-async-handler');

const AppError = require('../utils/app-error');
const { USER_TYPES } = require('../utils/constants');

const validateProfessorCourseAccess = ({ Course, Professor }) =>
  asyncHandler(async (req, res, next) => {
    const courseId = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === USER_TYPES.ADMIN || userRole === USER_TYPES.COORDINATOR) {
      return next();
    }

    if (userRole === USER_TYPES.PROFESSOR && courseId) {
      const teacher = await Professor.Professor.findOne({
        where: {
          user_id: userId,
        },
      });

      if (!teacher) next(new AppError('This teacher does not exist.', 404));

      const course = await Course.Course.findOne({
        where: {
          id: courseId,
          professor_id: teacher.id,
        },
      });

      if (!course) {
        return next(new AppError('You do not have access to this course.', 403));
      }
    }

    next();
  });

module.exports = validateProfessorCourseAccess;
