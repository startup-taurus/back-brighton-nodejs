const BaseService = require('./base.service');
const catchServiceAsync = require('../utils/catch-service-async');
const { validateParameters, calculateClassDates, formatHolidaysWithDates } = require('../utils/utils');
const AppError = require('../utils/app-error');
const { HOLIDAY_TYPE, STATUS } = require('../utils/constants');

let _holidays = null;
let _course = null;
let _courseSchedule = null;
let _syllabusItems = null;
let _sequelize = null;

module.exports = class HolidaysService extends BaseService {
  constructor({ Holidays, Course, CourseSchedule, SyllabusItems, Sequelize }) {
    super(Holidays);
    _holidays = Holidays.Holidays;
    _course = Course.Course;
    _courseSchedule = CourseSchedule.CourseSchedule;
    _syllabusItems = SyllabusItems.SyllabusItems;
    _sequelize = Sequelize;
  }

  recalculateAllCourseSchedules = catchServiceAsync(async (transaction) => {
    
    const activeCourses = await _course.findAll({
      where: { status: STATUS.ACTIVE },
      raw: true,
      transaction,
    });

    const activeHolidays = await _holidays.findAll({
      where: { status: STATUS.ACTIVE },
      raw: true,
      transaction,
    });

    const formattedHolidays = formatHolidaysWithDates(activeHolidays);

    for (const course of activeCourses) {
      try {
        const scheduledDates = await _courseSchedule.findAll({
          where: { course_id: course.id },
          order: [['scheduled_date', 'ASC']],
          raw: true,
          transaction,
        });

        if (scheduledDates.length === 0) {
          continue;
        }

        let startDateString;
        if (course.start_date instanceof Date) {
          startDateString = course.start_date.toISOString().split('T')[0];
        } else if (typeof course.start_date === 'string') {
          if (course.start_date.includes('/')) {
            const [day, month, year] = course.start_date.split('/');
            startDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else {
            startDateString = course.start_date.split('T')[0];
          }
        } else {
          continue;
        }

        const allItems = Array(scheduledDates.length).fill(1);
        
        const newClassDates = calculateClassDates(
          startDateString,
          allItems,
          course.schedule,
          formattedHolidays
        );

        if (newClassDates.length < scheduledDates.length) {
          continue;
        }

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

      } catch (error) {
      }
    }
    
  });

  getAllHolidays = catchServiceAsync(async (page = 1, limit = 10) => {
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);
    const data = await _holidays.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      order: [['id', 'DESC']],
    });

    return {
      data: {
        result: data.rows,
        totalCount: data.count,
      },
    };
  });

  getAllActiveHolidays = catchServiceAsync(async () => {
    const data = await _holidays.findAll({
      where: { status: STATUS.ACTIVE },  
      order: [['holiday_date', 'ASC']],
    });

    return {
      data,
    };
  });

  getHoliday = catchServiceAsync(async (id) => {
    const holiday = await _holidays.findByPk(id, { raw: true });
    if (!holiday) {
      throw new AppError('Holiday not found', 404);
    }
    return {
      data: holiday,
    };
  });

  createHoliday = catchServiceAsync(async (body) => {
    if (!body.holiday_name || !body.holiday_date || !body.holiday_type || !body.status) {
      throw new AppError('Missing required parameters: holiday_name, holiday_date, holiday_type, and status are required', 400);
    }

    return await _sequelize.transaction(async (transaction) => {
      const holiday = await _holidays.create(body, { transaction });
      if (body.holiday_type === HOLIDAY_TYPE.NATIONAL && body.status === STATUS.ACTIVE) {
        await this.recalculateAllCourseSchedules(transaction);
      }
      return holiday;
    });
  });

updateHoliday = catchServiceAsync(async (id, body) => {
  return await _sequelize.transaction(async (transaction) => {
    const holiday = await _holidays.findByPk(id, { transaction });
    if (!holiday) {
      throw new AppError('Holiday not found', 404);
    }

    const updatedHoliday = await holiday.update(body, { transaction });

    if (body.holiday_type === HOLIDAY_TYPE.NATIONAL && body.status === STATUS.ACTIVE) {
      await this.recalculateAllCourseSchedules(transaction);
    }

    return updatedHoliday;
  });
});

updateHolidayStatus = catchServiceAsync(async (id, body) => {
  return await _sequelize.transaction(async (transaction) => {
    const holiday = await _holidays.findByPk(id, { transaction });
    if (!holiday) {
      throw new AppError('Holiday not found', 404);
    }

    const previousStatus = holiday.status;
    const newStatus = body.status;

    const updatedHoliday = await holiday.update({ status: newStatus }, { transaction });

    if (holiday.holiday_type === HOLIDAY_TYPE.NATIONAL) {
      if (previousStatus === STATUS.ACTIVE && newStatus === STATUS.INACTIVE) {
        await this.recalculateAllCourseSchedules(transaction);
      }
      else if (previousStatus === STATUS.INACTIVE && newStatus === STATUS.ACTIVE) {
        await this.recalculateAllCourseSchedules(transaction);
      }
    }

    return updatedHoliday;
  });
});
  deleteHoliday = catchServiceAsync(async (id) => {
    return await _sequelize.transaction(async (transaction) => {
      const holiday = await _holidays.findByPk(id, { transaction });
      if (!holiday) {
        throw new AppError('Holiday not found', 404);
      }

      await holiday.destroy({ transaction });
      
      if (holiday.holiday_type === HOLIDAY_TYPE.NATIONAL && holiday.status === STATUS.ACTIVE) {
        await this.recalculateAllCourseSchedules(transaction);
      }
      
      return { message: 'Holiday deleted successfully' };
    });
  });
}; 
