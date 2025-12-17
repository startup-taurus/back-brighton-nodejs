const asyncHandler = require('express-async-handler');

const AppError = require('../utils/app-error');

const validateProfessorCourseAccess = ({ Course, Professor }) =>
  asyncHandler(async (req, res, next) => {
    const courseId = Number(req.params.id);
    const userId = req.user.id;
    const roleId = req.user.role_id;

    if (roleId === 1 || roleId === 5) {
      return next();
    }

    if (roleId === 2 && courseId) {
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
