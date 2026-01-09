const asyncHandler = require('express-async-handler');

const AppError = require('../utils/app-error');
const { ROLE_IDS } = require('../utils/constants');

const validateProfessorCourseAccess = ({ Course, Professor }) =>
  asyncHandler(async (req, res, next) => {
    const courseId = Number(req.params.id);
    const userId = req.user.id;
    const roleId = req.user.role_id;

    if (roleId === ROLE_IDS.ADMIN || roleId === ROLE_IDS.COORDINATOR) {
      return next();
    }

    if (roleId === ROLE_IDS.PROFESSOR && courseId) {
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
