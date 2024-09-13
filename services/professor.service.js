const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const AppError = require("../utils/app-error");
const { validateParameters } = require("../utils/utils");
let _professor = null;
let _course = null;
let _student = null;
module.exports = class ProfessorService extends BaseService {
  constructor({ Professor, Course, Student }) {
    super(Professor);
    _professor = Professor.Professor;
    _course = Course.Course;
    _student = Student.Student;
  }

  getAllProfessors = catchServiceAsync(async (page = 1, limit = 10) => {
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);
    const data = await _professor.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
    });

    return {
      data: {
        result: data.rows,
        totalCount: data.count,
      },
    };
  });

  getProfessor = catchServiceAsync(async (id) => {
    const professor = await _professor.findByPk(id, {
      include: [
        {
          model: _course,
          as: 'courses',
          include: [
            {
              model: _student,
              as: 'students',
            },
          ],
        },
      ],
    });
  
    if (!professor) {
      throw new AppError("Professor not found", 404);
    }
  
    return { data: professor };
  });  

  createProfessor = catchServiceAsync(async (body) => {
    const { name, cedula, email, status } = body;
    validateParameters({ name, cedula, email, status });
    const professor = await _professor.create(body);
    return { data: professor };
  });

  updateProfessor = catchServiceAsync(async (id, body) => {
    const professor = await _professor.update(body, { where: { id } });
    return { data: professor };
  });

  deleteProfessor = catchServiceAsync(async (id) => {
    const professor = await _professor.destroy({ where: { id } });
    return { data: professor };
  });
};
