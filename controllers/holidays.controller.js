const BaseController = require('./base.controller');
const catchControllerAsync = require('../utils/catch-controller-async');
const { appResponse } = require('../utils/app-response');
let _holidayService = null;
module.exports = class HolidaysController extends BaseController {
  constructor({ HolidaysService }) {
    super(HolidaysService);
    _holidayService = HolidaysService;
  }

  getAllHolidays = catchControllerAsync(async (req, res) => {
    const { page, limit } = req.query;
    const result = await _holidayService.getAllHolidays(page, limit);
    return appResponse(res, result);
  });

  getAllActiveHolidays = catchControllerAsync(async (req, res) => {
    const result = await _holidayService.getAllActiveHolidays();
    return appResponse(res, result);
  });

  getHoliday = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _holidayService.getHoliday(id);
    return appResponse(res, result);
  });

  createHoliday = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const result = await _holidayService.createHoliday(body);
    return appResponse(res, result);
  });

  updateHoliday = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const { id } = req.params;
    const result = await _holidayService.updateHoliday(id, body);
    return appResponse(res, result);
  });

  updateHolidayStatus = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const { id } = req.params;
    const result = await _holidayService.updateHolidayStatus(id, body);
    return appResponse(res, result);
  });

  deleteHoliday = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _holidayService.deleteHoliday(id);
    return appResponse(res, result);
  });

  recalculateAllSchedules = catchControllerAsync(async (req, res) => {
    const { sequelize } = require('../models');
    const transaction = await sequelize.transaction();
    
    try {
      await _holidayService.recalculateAllCourseSchedules(transaction);
      await transaction.commit();
      
      return appResponse(res, {
        data: { message: 'All course schedules recalculated successfully' }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });
};
