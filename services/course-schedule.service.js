const { isWithinInterval, isBefore } = require('date-fns');
const catchServiceAsync = require('../utils/catch-service-async');
const { calculateClassDates } = require('../utils/utils');
const BaseService = require('./base.service');

let _courseSchedule = null;
let _syllabusItems = null;
let _course = null;
let _holidays = null;
let _cancelledLesson = null;

module.exports = class CourseScheduleService extends BaseService {
  constructor({ CourseSchedule, SyllabusItems, Course, Holidays, CancelledLesson }) {
    super(CourseSchedule.CourseSchedule);
    _courseSchedule = CourseSchedule.CourseSchedule;
    _syllabusItems = SyllabusItems.SyllabusItems;
    _course = Course.Course;
    _holidays = Holidays.Holidays;
    _cancelledLesson = CancelledLesson.CancelledLesson;
  }

  getCourseScheduleDates = catchServiceAsync(async (courseId) => {
    const cancelledLessons = await _cancelledLesson.findAll({
      where: { course_id: courseId },
      raw: true,
    });
    
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
    
    const filteredResponse = response.filter(schedule => {
      const scheduleDate = schedule.scheduled_date.split('T')[0];
      return !cancelledLessons.some(cancelled => 
        cancelled.cancel_date === scheduleDate
      );
    });

    return { data: filteredResponse };
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

  deleteScheduleDaysOfClasess = catchServiceAsync(
    async (cancelledDate, transaction) => {
      let scheduledDates = await _courseSchedule.findAll({
        where: { course_id: cancelledDate.course_id },
        order: [['scheduled_date', 'ASC']],
        raw: true,
        transaction,
      });

      let isUpdated = false;

      const scheduledDatesToUpdate = scheduledDates.map(
        (scheduledDate, index) => {
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
        transaction,
      });
    }
  );
  recalculateScheduleDaysOfClasess = catchServiceAsync(
    async (cancelledDate, transaction) => {
      const scheduledDates = await _courseSchedule.findAll({
        where: { course_id: cancelledDate.course_id },
        order: [['scheduled_date', 'ASC']],
        raw: true,
        transaction,
        include: [
          {
            model: _syllabusItems,
            as: 'syllabusItem',
          },
        ],
      });
      
      const course = await _course.findByPk(cancelledDate.course_id, {
        raw: true,
      });
      
      const activeHolidays = await _holidays.findAll({
        where: { status: 'active' },
        raw: true,
      });
      
      const formattedHolidays = activeHolidays.map(holiday => ({
        ...holiday,
        holiday_date: new Date(holiday.holiday_date)
      }));
      const cancelledLessons = await _cancelledLesson.findAll({
        where: { course_id: cancelledDate.course_id },
        raw: true,
      });
      
      cancelledLessons.forEach(cancelledLesson => {
        const cancelledDateObj = new Date(cancelledLesson.cancel_date);
        formattedHolidays.push({
          holiday_date: cancelledDateObj,
          holiday_name: 'Cancelled Class',
          status: 'active'
        });
      });
      
      const originalStartDate = scheduledDates[0].scheduled_date;
      
      const allItems = Array(scheduledDates.length).fill(1);
      
      const newClassDates = calculateClassDates(
        originalStartDate,
        allItems,
        course.schedule,
        formattedHolidays
      );
      
      const scheduledDatesToUpdate = scheduledDates.map((scheduledDate, index) => {
        return {
          ...scheduledDate,
          id: scheduledDate.id,
          scheduled_date: newClassDates[index].toISOString().split('T')[0],
        };
      });
      
      await _courseSchedule.bulkCreate(scheduledDatesToUpdate, {
        updateOnDuplicate: ['scheduled_date'],
        transaction,
      });
    }
  );
};