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
      
      const formattedHolidays = activeHolidays.map(holiday => {
        let dateStr;
        if (holiday.holiday_date instanceof Date) {
          dateStr = holiday.holiday_date.toISOString().split('T')[0];
        } else {
          dateStr = holiday.holiday_date.toString().split('T')[0];
        }
        
        const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
        
        return {
          ...holiday,
          holiday_date: new Date(year, month - 1, day) 
        };
      });
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
      
      const originalStartDate = course.start_date;
      
      let startDateString;
      if (originalStartDate instanceof Date) {
        startDateString = originalStartDate.toISOString().split('T')[0];
      } else if (typeof originalStartDate === 'string') {
        if (originalStartDate.includes('/')) {
          const [day, month, year] = originalStartDate.split('/');
          startDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          startDateString = originalStartDate.split('T')[0];
        }
      } else {
        console.error('Invalid originalStartDate format:', originalStartDate);
        throw new Error('Invalid date format for recalculation');
      }
      
      console.log(`Recalculating dates for course ${cancelledDate.course_id} starting from original date: ${startDateString}`);
      
      const allItems = Array(scheduledDates.length).fill(1);
      
      const newClassDates = calculateClassDates(
        startDateString,
        allItems,
        course.schedule,
        formattedHolidays
      );
      
      if (newClassDates.length < scheduledDates.length) {
        console.error(`Not enough dates generated. Expected: ${scheduledDates.length}, Got: ${newClassDates.length}`);
        throw new Error('Failed to generate enough class dates for recalculation');
      }
      
      console.log(`Generated ${newClassDates.length} new class dates starting from ${startDateString}`);
      
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