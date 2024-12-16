const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');

let _cancelledLeasson = null;
let _courseSchedule = null;

module.exports = class CancelledLessonService extends BaseService {
  constructor({ CancelledLesson, CourseSchedule }) {
    super(CancelledLesson.CancelledLesson);
    _cancelledLeasson = CancelledLesson.CancelledLesson;
    _courseSchedule = CourseSchedule.CourseSchedule;
  }

  create = catchServiceAsync(async (body) => {
    const dayOfClass = await _courseSchedule.findOne({
      where: {
        course_id: body.course_id,
        scheduled_date: body.cancel_date,
      },
      raw: true,
    });

    if (!dayOfClass) {
      throw new AppError("You don't have classes this day", 404);
    }

    const cancelledLesson = await _cancelledLeasson.findOne({
      where: {
        course_id: Number(body.course_id),
        cancel_date: body.cancel_date,
      },
      raw: true,
    });

    if (cancelledLesson) {
      throw new AppError('The class has already been cancelled', 400);
    }

    await _cancelledLeasson.create(body);

    return {
      data: {},
    };
  });

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
