const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
let _courseScheduleService = null;

module.exports = class CourseScheduleController extends BaseController {
  constructor({ CourseScheduleService }) {
    super(CourseScheduleService);
    _courseScheduleService = CourseScheduleService;
  }

  getCourseScheduleDates = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _courseScheduleService.getCourseScheduleDates(id);
    return appResponse(res, result);
  });

  updateLessonTaught = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    const result = await _courseScheduleService.updateLessonTaught(id, body);
    return appResponse(res, result);
  });
};
