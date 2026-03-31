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
  upsertCourseAssignmentItem = catchControllerAsync(async (req, res) => {
    const { courseId } = req.params;
    const result = await _courseGradingService.upsertAssignment(courseId, req.body);
    return appResponse(res, result);
  });

  deleteCourseAssignmentItem = catchControllerAsync(async (req, res) => {
    const { courseId, itemId } = req.params;
    const result = await _courseGradingService.deleteCourseAssignmentItem(courseId, Number(itemId));
    return appResponse(res, result);
  });

  deleteCourseAssignmentItemsBatch = catchControllerAsync(async (req, res) => {
    const payload = req.body?.deletes || [];
    const result = await _courseGradingService.deleteCourseAssignmentItemsBatch(payload);
    return appResponse(res, result);
  });

  deleteAssignmentFromGradebook = catchControllerAsync(async (req, res) => {
    const { courseId, itemId } = req.params;
    const result = await _courseGradingService.deleteAssignmentFromGradebook(courseId, Number(itemId));
    return appResponse(res, result);
  });
};
