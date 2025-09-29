const { isWithinInterval, isBefore } = require('date-fns');
const { Op } = require('sequelize');
const catchServiceAsync = require('../utils/catch-service-async');
const { calculateClassDates } = require('../utils/utils');
const BaseService = require('./base.service');

let _courseSchedule = null;
let _syllabusItems = null;
let _course = null;
let _holidays = null;
let _cancelledLesson = null;
let _attendance = null;

module.exports = class CourseScheduleService extends BaseService {
  constructor({ CourseSchedule, SyllabusItems, Course, Holidays, CancelledLesson, Attendance }) {
    super(CourseSchedule.CourseSchedule);
    _courseSchedule = CourseSchedule.CourseSchedule;
    _syllabusItems = SyllabusItems.SyllabusItems;
    _course = Course.Course;
    _holidays = Holidays.Holidays;
    _cancelledLesson = CancelledLesson.CancelledLesson;
    _attendance = Attendance.Attendance;
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
  getSyllabusItemsByCourse = async (syllabusId) => {
    return await _syllabusItems.findAll({
      where: { 
        syllabus_id: syllabusId,
        item_name: { [Op.notLike]: '%DELETED%' }
      },
      order: [['id', 'ASC']],
      raw: true,
    });
  };

  getCourseSchedules = async (courseId, transaction) => {
    return await _courseSchedule.findAll({
      where: { course_id: courseId },
      order: [['scheduled_date', 'ASC']],
      raw: true,
      transaction,
    });
  };

  getActiveHolidays = async () => {
    return await _holidays.findAll({ 
      where: { status: 'active' }, 
      raw: true 
    });
  };

  getCancelledLessonsForCourse = async (courseId, excludeCancelledId = null, transaction) => {
    const whereCondition = excludeCancelledId 
      ? { course_id: courseId, id: { [Op.ne]: excludeCancelledId } }
      : { course_id: courseId };
    
    return await _cancelledLesson.findAll({
      where: whereCondition,
      raw: true,
      transaction,
    });
  };

  recalculateScheduleDaysOfClasess = catchServiceAsync(
    async (cancelledDate, transaction, excludeCancelledId = null) => {
      const course = await _course.findByPk(cancelledDate.course_id, { raw: true });
      
      const [syllabusItems, existingSchedules, activeHolidays, cancelledLessons] = await Promise.all([
        this.getSyllabusItemsByCourse(course.syllabus_id),
        this.getCourseSchedules(cancelledDate.course_id, transaction),
        this.getActiveHolidays(),
        this.getCancelledLessonsForCourse(cancelledDate.course_id, excludeCancelledId, transaction)
      ]);
      const parseDate = (date) => {
        const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date.toString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const holidays = [
        ...activeHolidays.map(h => ({ ...h, holiday_date: parseDate(h.holiday_date) })),
        ...cancelledLessons.map(l => ({ 
          holiday_date: parseDate(l.cancel_date), 
          holiday_name: 'Cancelled Class' 
        }))
      ];

      const newClassDates = calculateClassDates(
        course.start_date,
        syllabusItems,
        course.schedule,
        holidays
      ).slice(0, syllabusItems.length);

      const updatePromises = [];
      
      for (let i = 0; i < Math.min(existingSchedules.length, newClassDates.length); i++) {
        const newDate = newClassDates[i].toISOString().split('T')[0];
        if (existingSchedules[i].scheduled_date !== newDate) {
          updatePromises.push(
            _courseSchedule.update(
              { scheduled_date: newDate },
              { where: { id: existingSchedules[i].id }, transaction }
            )
          );
        }
      }

      await Promise.all(updatePromises);
    }
  );

};