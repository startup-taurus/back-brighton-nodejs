const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');

let _cancelledLeasson = null;

module.exports = class CancelledLessonService extends BaseService {
  constructor({ CancelledLesson }) {
    super(CancelledLesson.CancelledLesson);
    _cancelledLeasson = CancelledLesson.CancelledLesson;
  }

  getCancelledLessonsByCourse = catchServiceAsync(async (courseId) => {
    const cancelledLessons = await _cancelledLeasson.findAll({
      where: { course_id: courseId },
      raw: true,
    });

    if (!cancelledLessons) {
      throw new AppError('Lesson cancelled not found', 404);
    }
    return {
      data: cancelledLessons,
    };
  });
};
