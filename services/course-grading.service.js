const catchServiceAsync = require('../utils/catch-service-async');
const { validateParameters } = require('../utils/utils');
const BaseService = require('./base.service');

let _courseGrading = null;
let _gradingItem = null;
let _gradingCategory = null;
let _syllabusItems = null;
let _course = null;
let _gradePercentages = null;

module.exports = class CourseGradingService extends BaseService {
  constructor({
    SyllabusItems,
    CourseGrading,
    GradingItem,
    GradingCategory,
    Course,
    GradePercentages,
  }) {
    super();
    _syllabusItems = SyllabusItems.SyllabusItems;
    _courseGrading = CourseGrading.CourseGrading;
    _gradingItem = GradingItem.GradingItem;
    _gradingCategory = GradingCategory.GradingCategory;
    _course = Course.Course;
    _gradePercentages = GradePercentages.GradePercentages;
  }

  getGradingItemsByCourse = catchServiceAsync(async (courseId) => {
    const course = await _course.findByPk(courseId, {
      include: [
        {
          model: _courseGrading,
          as: 'grading_items', // Alias corregido para coincidir con la asociación
          attributes: ['id', 'weight'],
          include: [
            {
              model: _gradingItem,
              as: 'grading_item',
              attributes: ['id', 'name'],
              include: [
                {
                  model: _gradingCategory,
                  as: 'category', // Alias definido en la asociación
                  attributes: ['name'],
                },
              ],
            },
          ],
        },
      ],
      attributes: ['id', 'course_name'],
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const response = course.grading_items.map((definition) => ({
      item_id: definition.grading_item.id,
      item_name: definition.grading_item.name,
      category: definition.grading_item.category.name,
      weight: definition.weight,
    }));

    return { data: response };
  });

  getGradingPercentageBySyllabus = catchServiceAsync(async (syllabusId) => {
    validateParameters({
      syllabusId,
    });

    const response = await _gradePercentages.findOne({
      where: { syllabus_id: syllabusId },
    });

    return {
      data: response,
    };
  });
};
