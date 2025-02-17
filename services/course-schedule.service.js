const { isWithinInterval, isBefore } = require('date-fns');
const catchServiceAsync = require('../utils/catch-service-async');
const { calculateClassDates } = require('../utils/utils');
const BaseService = require('./base.service');

let _courseSchedule = null;
let _syllabusItems = null;
let _course = null;

module.exports = class CourseScheduleService extends BaseService {
  constructor({ CourseSchedule, SyllabusItems, Course }) {
    super(CourseSchedule.CourseSchedule);
    _courseSchedule = CourseSchedule.CourseSchedule;
    _syllabusItems = SyllabusItems.SyllabusItems;
    _course = Course.Course;
  }

  getCourseScheduleDates = catchServiceAsync(async (courseId) => {
    const response = await _courseSchedule.findAll({
      where: { course_id: courseId },
      order: [['scheduled_date', 'ASC']],
      include: [
        {
          model: _syllabusItems,
          as: 'syllabusItem',
          attributes: ['item_name'],
        },
      ],
    });

    return { data: response };
  });

  updateLessonTaught = catchServiceAsync(async (id, data) => {
    const response = await _courseSchedule.update(
      { ...data },
      { where: { id } }
    );

    return { data: response };
  });

  updateScheduleDaysOfClasess = catchServiceAsync(
    async (cancelledDate, transaction) => {
      const scheduledDates = await _courseSchedule.findAll({
        where: { course_id: cancelledDate.course_id },
        order: [['scheduled_date', 'ASC']],
        raw: true,
        transaction,
      });

      const course = await _course.findByPk(cancelledDate.course_id, {
        raw: true,
      });

      const startDate =
        scheduledDates[scheduledDates.length - 1].scheduled_date;
      const classDates = calculateClassDates(
        startDate,
        [1, 2],
        course.schedule
      );
      const newClassDate = classDates[1].toISOString().split('T')[0];
      let currentScheduleIndex = 0;

      const scheduledDatesToUpdate = scheduledDates.map((scheduledDate) => {
        if (scheduledDate.scheduled_date === cancelledDate.cancel_date) {
          currentScheduleIndex++;
        }

        let currentScheduleDate = {
          ...scheduledDate,
          id: scheduledDate.id,
          scheduled_date:
            scheduledDates[currentScheduleIndex]?.scheduled_date ??
            newClassDate,
        };
        currentScheduleIndex++;
        return currentScheduleDate;
      });

      await _courseSchedule.bulkCreate(scheduledDatesToUpdate, {
        updateOnDuplicate: ['scheduled_date'],
        transaction,
      });
    }
  );

  deleteScheduleDaysOfClasess = catchServiceAsync(async (cancelledDate) => {
    let scheduledDates = await _courseSchedule.findAll({
      where: { course_id: cancelledDate.course_id },
      order: [['scheduled_date', 'ASC']],
      raw: true,
    });

    let isUpdated = false;

    const scheduledDatesToUpdate = scheduledDates.map(
      (scheduledDate, index) => {
        const qurrentDate = scheduledDates[index].scheduled_date;
        const nextDate = scheduledDates[index + 1]
          ? scheduledDates[index + 1].scheduled_date
          : null;

        if (
          !isUpdated &&
          isBefore(
            new Date(cancelledDate.cancel_date),
            new Date(scheduledDate.scheduled_date)
          )
        ) {
          isUpdated = true;
          return {
            ...scheduledDate,
            scheduled_date: cancelledDate.cancel_date,
          };
        }

        if (isUpdated) {
          return {
            ...scheduledDate,
            scheduled_date: scheduledDates[index - 1].scheduled_date,
          };
        }

        return scheduledDate;
      }
    );

    await _courseSchedule.bulkCreate(scheduledDatesToUpdate, {
      updateOnDuplicate: ['scheduled_date'],
    });
  });
};
