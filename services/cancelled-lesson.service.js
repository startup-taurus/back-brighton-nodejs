const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');

let _cancelledLeasson = null;
let _courseSchedule = null;
let _courseScheduleService = null;
let _sequelize = null;

module.exports = class CancelledLessonService extends BaseService {
  constructor({
    CancelledLesson,
    CourseSchedule,
    CourseScheduleService,
    Sequelize,
  }) {
    super(CancelledLesson.CancelledLesson);
    _cancelledLeasson = CancelledLesson.CancelledLesson;
    _courseSchedule = CourseSchedule.CourseSchedule;
    _courseScheduleService = CourseScheduleService;
    _sequelize = Sequelize;
  }

  valideIfDayOfClassExist = catchServiceAsync(async (body) => {
    const scheduleDate = body.cancel_date;
    const dayOfClass = await _courseSchedule.count({
      where: {
        course_id: body.course_id,
        scheduled_date: _sequelize.where(
          _sequelize.fn('DATE', _sequelize.col('scheduled_date')),
          '=',
          scheduleDate
        ),
      },
      raw: true,
    });
    if (dayOfClass === 0) {
      throw new AppError("You don't have classes this day", 404);
    }
  });

  validateIfCancelledLessonExist = catchServiceAsync(
    async (body, isCancelation = true) => {
      const cancelledLesson = await _cancelledLeasson.count({
        where: {
          course_id: Number(body.course_id),
          cancel_date: body.cancel_date,
        },
        raw: true,
      });

      if (cancelledLesson > 0 && isCancelation) {
        throw new AppError('The class has already been cancelled', 400);
      }

      if (cancelledLesson === 0 && !isCancelation) {
        throw new AppError("Cancelled lesson doesn't exist", 400);
      }
    }
  );

  create = catchServiceAsync(async (body) => {
    await this.valideIfDayOfClassExist(body);
    await this.validateIfCancelledLessonExist(body);

    return await _sequelize.transaction(async (transaction) => {
      await _cancelledLeasson.create(body, { transaction });
      await _courseScheduleService.updateScheduleDaysOfClasess(
        body,
        transaction
      );

      return {
        data: {},
      };
    });
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

  delete = catchServiceAsync(async (body) => {
    if (!body.id) {
      throw new AppError('Id must be sent', 400);
    }
    await this.validateIfCancelledLessonExist(body, false);

    return await _sequelize.transaction(async (transaction) => {
      await _courseScheduleService.deleteScheduleDaysOfClasess(
        body,
        transaction
      );
      return await _cancelledLeasson.destroy({
        where: { id: body.id },
        transaction,
      });
    });
  });
};
