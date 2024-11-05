const BaseController = require("./base.controller");
const catchControllerAsync = require("../utils/catch-controller-async");
const { appResponse } = require("../utils/app-response");
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
};