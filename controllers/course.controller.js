const catchControllerAsync = require("../utils/catch-controller-async");
const BaseController = require("./base.controller");
const { appResponse } = require("../utils/app-response");
let _courseService = null;
module.exports = class CourseController extends BaseController {
  constructor({ CourseService }) {
    super(CourseService);
    _courseService = CourseService;
  }

  getAllCourses = catchControllerAsync(async (req, res) => {
    const { page, limit } = req.query;
    const result = await _courseService.getAllCourses(page, limit);
    return appResponse(res, result);
  });

  getCourse = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _courseService.getCourse(id);
    return appResponse(res, result);
  });

  getCourseWithStudents = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _courseService.getCourseWithStudents(id);
    return appResponse(res, result);
  });

  getAllCoursesWithProfessors = catchControllerAsync(async (req, res) => {
    const { page, limit } = req.query;
    const result = await _courseService.getAllCoursesWithProfessors(page, limit);
    return appResponse(res, result);
  });

  createCourse = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const result = await _courseService.createCourse(body);
    return appResponse(res, result);
  });

  updateCourse = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const { id } = req.params;
    const result = await _courseService.updateCourse(id, body);
    return appResponse(res, result);
  });
};
