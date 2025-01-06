const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const { validateParameters } = require('../utils/utils');
const AppError = require('../utils/app-error');

let _studentGrades = null;
module.exports = class StudentGradesService extends BaseService {
  constructor({ StudentGrades }) {
    super(StudentGrades.StudentGrades);
    _studentGrades = StudentGrades.StudentGrades;
  }

  getGradesByCourse = catchServiceAsync(async (courseId) => {
    const grades = await _studentGrades.findAll({
      where: { course_id: courseId },
      raw: true,
    });

    if (!grades) {
      throw new AppError('Data not found', 404);
    }

    return { data: grades };
  });

  getGradesByCourseAndStudent = catchServiceAsync(
    async (courseId, studentId) => {
      const grades = await _studentGrades.findAll({
        where: { course_id: courseId, student_id: studentId },
        raw: true,
      });

      if (!grades) {
        throw new AppError('Data not found', 404);
      }

      return { data: grades };
    }
  );

  createStudentGrade = async (body) => {
    const { course_id, student_id, grading_item_id, grade } = body;

    validateParameters({
      course_id,
      student_id,
      grading_item_id,
      grade,
    });

    const studentGrade = await _studentGrades.findOne({
      where: {
        course_id,
        student_id,
        grading_item_id,
      },
    });

    let studentGrades;

    if (!studentGrade) {
      studentGrades = await _studentGrades.create({
        course_id,
        student_id,
        grading_item_id,
        grade,
      });
    } else {
      studentGrades = await _studentGrades.update(
        {
          grade,
        },
        { where: { course_id, student_id, grading_item_id } }
      );
    }

    return { data: studentGrades };
  };
};
