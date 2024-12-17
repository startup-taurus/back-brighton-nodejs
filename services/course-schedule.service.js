const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { Op } = require('sequelize');

let _courseSchedule = null;
let _syllabusItems = null;

module.exports = class CourseScheduleService extends BaseService {
  constructor({ CourseSchedule, SyllabusItems }) {
    super(CourseSchedule.CourseSchedule);
    _courseSchedule = CourseSchedule.CourseSchedule;
    _syllabusItems = SyllabusItems.SyllabusItems;
  }

  getCourseScheduleDates = catchServiceAsync(async (courseId) => {
    const response = await _courseSchedule.findAll({
      where: { course_id: courseId },
      order: [['scheduled_date', 'ASC']],
      include: [
        {
          model: _syllabusItems,
          as: 'syllabusItem',
          attributes: ['item_name'],
        },
      ],
    });

    return { data: response };
  });

  updateLessonTaught = catchServiceAsync(async (id, data) => {
    const response = await _courseSchedule.update(
      { ...data },
      { where: { id } }
    );

    return { data: response };
  });
};
