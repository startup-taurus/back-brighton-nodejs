const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const { validateParameters } = require("../utils/utils");
const AppError = require("../utils/app-error");
let _course = null;
let _syllabus = null;
let _gradingItem = null;
let _syllabusItems = null;
let _gradePercentages = null;

module.exports = class SyllabusService extends BaseService {
  constructor({
    Syllabus,
    SyllabusItems,
    GradePercentages,
    GradingItem,
    Course,
  }) {
    super(Syllabus.Syllabus);
    _course = Syllabus.Course;
    _syllabus = Syllabus.Syllabus;
    _gradingItem = GradingItem.GradingItem;
    _syllabusItems = SyllabusItems.SyllabusItems;
    _gradePercentages = GradePercentages.GradePercentages;
  }

  getAllSyllabus = catchServiceAsync(async (page = 1, limit = 10) => {
    const limitNumber = parseInt(limit);
    const pageNumber = parseInt(page);
    const offset = (pageNumber - 1) * limitNumber;

    const syllabus = await _syllabus.findAndCountAll({
      include: [
        {
          model: _syllabusItems,
          as: "items",
          attributes: ["id", "item_name"],
        },
        {
          model: _gradePercentages,
          as: "percentages",
          attributes: [
            "assig_percentage",
            "test_percentage",
            "exam_percentage",
          ],
        },
        {
          model: _gradingItem,
          as: "grading_items",
          attributes: ["id", "name", "category_id"],
        },
      ],
      attributes: ["id", "syllabus_name"],
      limit: limitNumber,
      offset,
    });

    if (!syllabus || syllabus.rows.length === 0) {
      throw new AppError("No syllabus found", 404);
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
      };
    });

    return { data, totalCount: syllabus.count };
  });

  getSyllabusById = catchServiceAsync(async (id) => {
    const syllabus = await _syllabus.findByPk(id, {
      include: [
        {
          model: _syllabusItems,
          as: "items",
          attributes: ["id", "item_name"],
        },
        {
          model: _gradePercentages,
          as: "percentages",
          attributes: [
            "assig_percentage",
            "test_percentage",
            "exam_percentage",
          ],
        },
      ],
      attributes: ["id", "syllabus_name"],
    });

    if (!syllabus) {
      throw new AppError("Syllabus not found", 404);
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
    } = body;

    const syllabus = await _syllabus.findByPk(id, {
      include: [
        {
          model: _syllabusItems,
          as: "items",
        },
        {
          model: _gradePercentages,
          as: "percentages",
        },
      ],
    });

    if (!syllabus) {
      throw new AppError("Syllabus not found", 404);
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

    return { data: syllabus };
  });

  getIdSyllabus = catchServiceAsync(async (id) => {
    const syllabus = await _syllabus.findByPk(id, {
      include: [
        {
          model: _syllabusItems,
          as: "items",
          attributes: ["id"],
        },
      ],
    });
    return syllabus;
  });
};
