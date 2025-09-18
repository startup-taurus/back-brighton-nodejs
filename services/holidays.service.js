const BaseService = require('./base.service');
const catchServiceAsync = require('../utils/catch-service-async');
const { validateParameters, calculateClassDates } = require('../utils/utils');
const AppError = require('../utils/app-error');
const { HOLIDAY_TYPE } = require('../utils/constants');

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
    console.log('Starting recalculation of all course schedules due to holiday changes...');
    
    const activeCourses = await _course.findAll({
      where: { status: 'active' },
      raw: true,
      transaction,
    });

    console.log(`Found ${activeCourses.length} active courses to recalculate`);

    const activeHolidays = await _holidays.findAll({
      where: { status: 'active' },
      raw: true,
      transaction,
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

    console.log(`Using ${formattedHolidays.length} active holidays for recalculation`);

    for (const course of activeCourses) {
      try {
        const scheduledDates = await _courseSchedule.findAll({
          where: { course_id: course.id },
          order: [['scheduled_date', 'ASC']],
          raw: true,
          transaction,
        });

        if (scheduledDates.length === 0) {
          console.log(`Course ${course.id} has no scheduled dates, skipping`);
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
          console.log(`Course ${course.id} has invalid start_date format, skipping`);
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
          console.error(`Failed to generate enough class dates for course ${course.id}`);
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

        console.log(`Successfully recalculated schedule for course ${course.id} (${course.course_number})`);
      } catch (error) {
        console.error(`Error recalculating schedule for course ${course.id}:`, error);
      }
    }
    
    console.log('Completed recalculation of all course schedules');
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
      where: { status: 'active' },  
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

    const transaction = await _sequelize.transaction();
    try {
      const holidayData = {
        holiday_name: body.holiday_name,
        holiday_date: body.holiday_date,
        holiday_type: body.holiday_type,
        status: body.status,
        description: body.description || null
      };

      const newHoliday = await _holidays.create(holidayData, { transaction });

      if (body.holiday_type === HOLIDAY_TYPE.NATIONAL && body.status === 'active') {
        await this.recalculateAllCourseSchedules(transaction);
      }

      await transaction.commit();
      return newHoliday;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  updateHoliday = catchServiceAsync(async (id, body) => {
    const transaction = await _sequelize.transaction();
    try {
      const holiday = await _holidays.findByPk(id);
      if (!holiday) {
        throw new AppError('Holiday not found', 404);
      }

      const updatedHoliday = await holiday.update(body, { transaction });

      if (body.holiday_type === HOLIDAY_TYPE.NATIONAL && body.status === 'active') {
        await this.recalculateAllCourseSchedules(transaction);
      }

      await transaction.commit();
      return updatedHoliday;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  updateHolidayStatus = catchServiceAsync(async (id, body) => {
    const transaction = await _sequelize.transaction();
    try {
      const holiday = await _holidays.findByPk(id);
      if (!holiday) {
        throw new AppError('Holiday not found', 404);
      }

      const previousStatus = holiday.status;
      const newStatus = body.status;

      const updatedHoliday = await holiday.update({ status: newStatus }, { transaction });

      if (holiday.holiday_type === 'national') {
        if (previousStatus === 'active' && newStatus === 'inactive') {
          console.log(`Holiday "${holiday.holiday_name}" deactivated. Regenerating attendance for ${holiday.holiday_date}...`);
          await this.recalculateAllCourseSchedules(transaction);
        }
        else if (previousStatus === 'inactive' && newStatus === 'active') {
          console.log(`Holiday "${holiday.holiday_name}" activated. Removing attendance for ${holiday.holiday_date}...`);
          await this.recalculateAllCourseSchedules(transaction);
        }
      }

      await transaction.commit();
      return updatedHoliday;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  deleteHoliday = catchServiceAsync(async (id) => {
    const transaction = await _sequelize.transaction();
    try {
      const holiday = await _holidays.findByPk(id);
      if (!holiday) {
        throw new AppError('Holiday not found', 404);
      }

      await holiday.destroy({ transaction });
      await transaction.commit();
      return { message: 'Holiday deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });
};
