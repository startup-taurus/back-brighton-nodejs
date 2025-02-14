const catchControllerAsync = require('../utils/catch-controller-async');
const BaseController = require('./base.controller');
const { appResponse } = require('../utils/app-response');
let _professorService = null;
module.exports = class ProfessorController extends BaseController {
  constructor({ ProfessorService }) {
    super(ProfessorService);
    _professorService = ProfessorService;
  }

  getAllProfessors = catchControllerAsync(async (req, res) => {
    const result = await _professorService.getAllProfessors({ ...req.query });
    return appResponse(res, result);
  });

  getProfessor = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _professorService.getProfessor(id);
    return appResponse(res, result);
  });

  getProfessorCourses = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _professorService.getProfessorCourses(id);
    return appResponse(res, result);
  });

  getActiveProfessors = catchControllerAsync(async (req, res) => {
    const { page, limit, search } = req.query;
    const result = await _professorService.getActiveProfessors(
      page,
      limit,
      search
    );
    return appResponse(res, result);
  });

  getProfessorsCourseAndStudentCount = catchControllerAsync(async (req, res) => {
    const result = await _professorService.getProfessorsCourseAndStudentCount();
    return appResponse(res, result);
  })

  createProfessor = catchControllerAsync(async (req, res) => {
    const body = req.body;
    if (req.file) {
      body.image = req.file.filename;
    }
    const result = await _professorService.createProfessor(body);
    return appResponse(res, result);
  });

  updateProfessor = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const { id } = req.params;
    const result = await _professorService.updateProfessor(id, body);
    return appResponse(res, result);
  });

  updateProfessorStatus = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const { id } = req.params;
    const result = await _professorService.updateProfessorStatus(id, body);
    return appResponse(res, result);
  });

  deleteProfessor = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _professorService.deleteProfessor(id);
    return appResponse(res, result);
  });
};
