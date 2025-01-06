const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
let _courseGradingService = null;

module.exports = class CourseGradingController extends BaseController {
  constructor({ CourseGradingService }) {
    super(CourseGradingService);
    _courseGradingService = CourseGradingService;
  }

  getGradingItemsByCourse = catchControllerAsync(async (req, res) => {
    const { courseId } = req.params;
    const result = await _courseGradingService.getGradingItemsByCourse(
      courseId
    );
    return appResponse(res, result);
  });

  createGradingItemsByCourse = catchControllerAsync(async (req, res) => {
    const { courseId } = req.params;
    const body = req.body;
    const result = await _gradingService.createGradingItemsByCourse(
      courseId,
      body
    );
    return appResponse(res, result);
  });

  getGradingPercentageBySyllabus = catchControllerAsync(async (req, res) => {
    const { syllabusId } = req.params;
    const result = await _courseGradingService.getGradingPercentageBySyllabus(
      syllabusId
    );
    return appResponse(res, result);
  });
};
