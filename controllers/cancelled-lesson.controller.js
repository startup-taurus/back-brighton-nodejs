const BaseController = require('./base.controller');
const catchControllerAsync = require('../utils/catch-controller-async');
const { appResponse } = require('../utils/app-response');
let _cancelledLessonService = null;
module.exports = class CancelledLessonController extends BaseController {
  constructor({ CancelledLessonService }) {
    super(CancelledLessonService);
    _cancelledLessonService = CancelledLessonService;
  }

  create = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const result = await _cancelledLessonService.create(body);
    return appResponse(res, result);
  });

  getCancelledLessonsByCourse = catchControllerAsync(async (req, res) => {
    const { courseId } = req.params;

    const result = await _cancelledLessonService.getCancelledLessonsByCourse(
      courseId
    );
    return appResponse(res, result);
  });
};
