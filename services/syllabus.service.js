const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const { validateParameters } = require('../utils/utils');
const AppError = require('../utils/app-error');
let _course = null;
let _syllabus = null;
let _syllabusItems = null;
let _gradePercentages = null;

module.exports = class SyllabusService extends BaseService {
  constructor({ Syllabus, SyllabusItems, GradePercentages, Course }) {
    super(Syllabus.Syllabus);
    _course = Syllabus.Course;
    _syllabus = Syllabus.Syllabus;
    _syllabusItems = SyllabusItems.SyllabusItems;
    _gradePercentages = GradePercentages.GradePercentages;
  }

  getAllSyllabus = catchServiceAsync(async (page = 1, limit = 10) => {
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);
    const offset = (pageNumber - 1) * limitNumber;
    const syllabus = await _syllabus.findAndCountAll({
      include: [
        {
          model: _syllabusItems,
          as: 'items',
          attributes: ['id', 'item_name'],
        },
        {
          model: _gradePercentages,
          as: 'percentages',
          attributes: [
            'assig_percentage',
            'test_percentage',
            'exam_percentage',
          ],
        },
      ],
      attributes: ['id', 'syllabus_name'],
      limit: limitNumber,
      offset,
    });

    if (!syllabus || syllabus.length === 0) {
      throw new AppError('No syllabus found', 404);
    }

    return { data: syllabus.rows, totalCount: syllabus.count };
  });

  getSyllabusById = catchServiceAsync(async (id) => {
    const syllabus = await _syllabus.findByPk(id, {
      include: [
        {
          model: _syllabusItems,
          as: 'items',
          attributes: ['id', 'item_name'],
        },
        {
          model: _gradePercentages,
          as: 'percentages',
          attributes: [
            'assig_percentage',
            'test_percentage',
            'exam_percentage',
          ],
        },
      ],
      attributes: ['id', 'syllabus_name'],
    });

    if (!syllabus) {
      throw new AppError('Syllabus not found', 404);
    }

    return { data: syllabus };
  });

  createSyllabus = catchServiceAsync(async (body) => {
    const {
      syllabus_name,
      items,
      assig_percentage,
      test_percentage,
      exam_percentage,
    } = body;

    validateParameters({
      syllabus_name,
      assig_percentage,
      test_percentage,
      exam_percentage,
    });

    const syllabus = await _syllabus.create({ syllabus_name });

    if (items && items.length > 0) {
      await Promise.all(
        items.map((item) =>
          _syllabusItems.create({ syllabus_id: syllabus.id, item_name: item })
        )
      );
    }

    await _gradePercentages.create({
      syllabus_id: syllabus.id,
      assig_percentage,
      test_percentage,
      exam_percentage,
    });

    return { data: syllabus };
  });

  updateSyllabus = catchServiceAsync(async (id, body) => {
    const {
      syllabus_name,
      items,
      assig_percentage,
      test_percentage,
      exam_percentage,
    } = body;

    const syllabus = await _syllabus.findByPk(id, {
      include: [
        {
          model: _syllabusItems,
          as: 'items',
        },
        {
          model: _gradePercentages,
          as: 'percentages',
        },
      ],
    });

    if (!syllabus) {
      throw new AppError('Syllabus not found', 404);
    }

    await syllabus.update({ syllabus_name });

    if (items && items.length > 0) {
      await _syllabusItems.destroy({ where: { syllabus_id: id } });

      await Promise.all(
        items.map((item) =>
          _syllabusItems.create({ syllabus_id: id, item_name: item })
        )
      );
    }

    if (test_percentage !== undefined && exam_percentage !== undefined) {
      const percentages = await _gradePercentages.findOne({
        where: { syllabus_id: id },
      });

      if (percentages) {
        await percentages.update({
          assig_percentage,
          test_percentage,
          exam_percentage,
        });
      } else {
        await _gradePercentages.create({
          syllabus_id: id,
          test_percentage,
          exam_percentage,
        });
      }
    }
    return { data: [] };
  });

  getIdSyllabus = catchServiceAsync(async (id) => {
    const syllabus = await _syllabus.findByPk(id, {
      include: [
        {
          model: _syllabusItems,
          as: 'items',
          attributes: ['id'],
        },
      ],
    });
    return syllabus;
  });
};
