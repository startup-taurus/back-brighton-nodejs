const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const { validateParameters } = require('../utils/utils');
const AppError = require('../utils/app-error');
let _course = null;
let _syllabus = null;
let _gradingItem = null;
let _syllabusItems = null;
let _gradePercentages = null;
let _courseGrading = null;
let _sequelize = null;
let _percentages = null;

module.exports = class SyllabusService extends BaseService {
  constructor({
    Syllabus,
    SyllabusItems,
    GradePercentages,
    GradingItem,
    Course,
    CourseGrading,
    Percentages,
    Sequelize,
  }) {
    super(Syllabus.Syllabus);
    _course = Syllabus.Course;
    _syllabus = Syllabus.Syllabus;
    _gradingItem = GradingItem.GradingItem;
    _syllabusItems = SyllabusItems.SyllabusItems;
    _gradePercentages = GradePercentages.GradePercentages;
    _courseGrading = CourseGrading.CourseGrading;
    _percentages = Percentages.Percentages;
    _sequelize = Sequelize;
  }

  getAllSyllabus = catchServiceAsync(async (page = 1, limit = 10) => {
    const limitNumber = parseInt(limit);
    const pageNumber = parseInt(page);
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
        {
          model: _gradingItem,
          as: 'grading_items',
          attributes: ['id', 'name', 'category_id'],
        },
        {
          model: _percentages,
          as: 'percentages_syllabus',
          attributes: ['name', 'min', 'max'],
        },
      ],
      attributes: ['id', 'syllabus_name'],
      limit: limitNumber,
      offset,
    });

    if (!syllabus || syllabus.rows.length === 0) {
      throw new AppError('No syllabus found', 404);
    }
    const data = syllabus.rows.map((syllabus) => {
      const gradingItems = syllabus.grading_items || [];

      const assignments = gradingItems
        .filter((item) => item.category_id === 1)
        .map((item) => item.name);
      const progressTests = gradingItems
        .filter((item) => item.category_id === 2)
        .map((item) => item.name);
      const moversExam = gradingItems
        .filter((item) => item.category_id === 3)
        .map((item) => item.name);

      return {
        id: syllabus.id,
        syllabus_name: syllabus.syllabus_name,
        items: syllabus.items,
        percentages: syllabus.percentages,
        assignments,
        progress_tests: progressTests,
        movers_exam: moversExam,
        percentages_syllabus: syllabus.percentages_syllabus,
      };
    });

    return { data, totalCount: syllabus.count };
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
      assignments,
      progress_tests,
      movers_exam,
      percentages,
    } = body;

    validateParameters({
      syllabus_name,
      assig_percentage,
      test_percentage,
      exam_percentage,
      percentages,
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

    const gradingCategories = [
      { categoryId: 1, items: assignments },
      { categoryId: 2, items: progress_tests },
      { categoryId: 3, items: movers_exam },
    ];

    const gradingItems = gradingCategories.flatMap(({ categoryId, items }) =>
      (items || []).map((item) => ({
        category_id: categoryId,
        syllabus_id: syllabus.id,
        name: item,
      }))
    );

    if (gradingItems.length > 0) {
      await _gradingItem.bulkCreate(gradingItems);
    }

    if (percentages && percentages.length > 0) {
      const percentagesToCreate = percentages.map(({ name, min, max }) => ({
        name,
        min,
        max,
        syllabus_id: syllabus.id,
      }));

      await _percentages.bulkCreate(percentagesToCreate);
    }

    return { data: syllabus };
  });

  updateSyllabus = catchServiceAsync(async (id, body) => {
    const {
      syllabus_name,
      items,
      assig_percentage,
      test_percentage,
      exam_percentage,
      assignments,
      progress_tests,
      movers_exam,
      percentages,
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

    //TODO: verificar que no se guarda correctamente

    // if (items && items.length > 0) {
    //   await _syllabusItems.destroy({ where: { syllabus_id: id } });
    //   const syllabusItems = items.map((item) => ({
    //     syllabus_id: id,
    //     item_name: item,
    //   }));
    //   await _syllabusItems.bulkCreate(syllabusItems);
    // }

    if (
      assig_percentage !== undefined &&
      test_percentage !== undefined &&
      exam_percentage !== undefined
    ) {
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
          assig_percentage,
          test_percentage,
          exam_percentage,
        });
      }
    }

    const gradingCategories = [
      { categoryId: 1, items: assignments },
      { categoryId: 2, items: progress_tests },
      { categoryId: 3, items: movers_exam },
    ];

    await _gradingItem.destroy({ where: { syllabus_id: id } });

    const gradingItems = gradingCategories.flatMap(({ categoryId, items }) =>
      (items || []).map((item) => ({
        category_id: categoryId,
        syllabus_id: id,
        name: item,
      }))
    );

    if (gradingItems.length > 0) {
      await _gradingItem.bulkCreate(gradingItems);
    }

    if (percentages && Array.isArray(percentages)) {
      await _percentages.destroy({ where: { syllabus_id: id } });

      const newPercentages = percentages.map(({ name, min, max }) => ({
        name,
        min,
        max,
        syllabus_id: id,
      }));

      if (newPercentages.length > 0) {
        await _percentages.bulkCreate(newPercentages);
      }
    }

    return { data: syllabus };
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

  createAssignmentGradingItem = catchServiceAsync(async (body) => {
    const { syllabus_id, course_id } = body;

    validateParameters({ syllabus_id });

    const transaction = await _sequelize.transaction();
    try {
      const response = await _gradingItem.create(
        {
          category_id: 1,
          syllabus_id,
          name: 'Item',
        },
        { transaction }
      );

      await _courseGrading.create(
        {
          grading_item_id: response.id,
          course_id,
          weight: 0,
        },
        { transaction }
      );

      await transaction.commit();

      return { data: response };
    } catch (e) {
      await transaction.rollback();
      throw new AppError('Error creating the field', 400);
    }
  });

  updateAssignmentGradingItem = catchServiceAsync(async (body) => {
    const { name, id } = body;

    validateParameters({ id });

    const response = await _gradingItem.update(
      {
        name,
      },
      { where: { id } }
    );

    return { data: response };
  });

  getFinalPercentageBySyllabusId = catchServiceAsync(async (syllabus_id) => {
    validateParameters({ 'Sylllabus id': syllabus_id });

    const response = await _percentages.findAll({ where: { syllabus_id } });

    return { data: response };
  });
};
