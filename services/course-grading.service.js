const AppError = require('../utils/app-error');
const catchServiceAsync = require('../utils/catch-service-async');
const {validateParameters} = require('../utils/utils');
const {Op} = require('sequelize');
const {
  ERROR_MESSAGES,
  GRADING_CATEGORIES,
  GRADING_ORIGIN,
} = require('../utils/constants');
const BaseService = require('./base.service');

let _courseGrading = null;
let _gradingItem = null;
let _gradingCategory = null;
let _syllabusItems = null;
let _course = null;
let _gradePercentages = null;
let _studentGrades = null;
let _professor = null;
let _user = null;

module.exports = class CourseGradingService extends BaseService {
  constructor({
    SyllabusItems,
    CourseGrading,
    GradingItem,
    GradingCategory,
    Course,
    GradePercentages,
    StudentGrades,
    Professor,
    User,
  }) {
    super();
    _syllabusItems = SyllabusItems.SyllabusItems;
    _courseGrading = CourseGrading.CourseGrading;
    _gradingItem = GradingItem.GradingItem;
    _gradingCategory = GradingCategory.GradingCategory;
    _course = Course.Course;
    _gradePercentages = GradePercentages.GradePercentages;
    _studentGrades = StudentGrades.StudentGrades;
    _professor = Professor.Professor;
    _user = User.User;
  }

  getGradingItemsByCourse = catchServiceAsync(async (courseId) => {
    const course = await _course.findByPk(courseId, {
      include: [
        {
          model: _courseGrading,
          as: 'grading_items',
          attributes: ['id', 'weight'],
          include: [
            {
              model: _gradingItem,
              as: 'grading_item',
              attributes: ['id', 'name'],
              include: [
                {
                  model: _gradingCategory,
                  as: 'category',
                  attributes: ['name'],
                },
              ],
            },
          ],
        },
        {
          model: _professor,
          as: 'professor',
          attributes: ['id'],
          include: [
            { model: _user, as: 'user', attributes: ['name'] },
          ],
        },
      ],
      attributes: ['id', 'course_name', 'syllabus_id'],
    });

    if (!course) throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, 404);

    const sortedDefs = (course.grading_items || [])
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id));

    let response = sortedDefs.map((definition) => ({
      item_id: definition.grading_item.id,
      item_name: definition.grading_item.name,
      category: definition.grading_item.category.name,
      weight: definition.weight,
      origin: GRADING_ORIGIN.COURSE,
    }));

    if (course.syllabus_id) {
      const allItems = await _gradingItem.findAll({
        where: {syllabus_id: course.syllabus_id},
        attributes: ['id', 'name', 'category_id'],
        include: [
          {model: _gradingCategory, as: 'category', attributes: ['name']},
        ],
      });
      const existingIds = new Set(response.map((r) => r.item_id));

      const gradingLinks = await _courseGrading.findAll({
        attributes: ['grading_item_id'],
        raw: true,
      });
      const usageByItemId = new Map();
      for (const link of gradingLinks) {
        const id = Number(link.grading_item_id);
        usageByItemId.set(id, (usageByItemId.get(id) || 0) + 1);
      }

      const missing = allItems
        .filter(
          (item) =>
            item.category?.name !== GRADING_CATEGORIES.ASSIGNMENT &&
            (usageByItemId.get(item.id) || 0) === 0 && !existingIds.has(item.id)
        )
        .map((item) => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category?.name,
          weight: 0,
          origin: GRADING_ORIGIN.SYLLABUS,
        }));
      if (missing.length > 0) {
        response = [...response, ...missing];
      }
    }

    const assignmentsSyllabus = response.filter(
      (r) =>
        r.category === GRADING_CATEGORIES.ASSIGNMENT &&
        r.origin === GRADING_ORIGIN.SYLLABUS
    );

    const assignmentsCourse = response.filter(
      (r) =>
        r.category === GRADING_CATEGORIES.ASSIGNMENT &&
        r.origin === GRADING_ORIGIN.COURSE
    );

    const nonAssignments = response.filter(
      (r) => r.category !== GRADING_CATEGORIES.ASSIGNMENT
    );

    const ordered = [
      ...assignmentsSyllabus,
      ...assignmentsCourse,
      ...nonAssignments,
    ];

    return {data: ordered};
  });

  upsertAssignment = catchServiceAsync(async (courseId, body) => {
    const id = body?.itemId;

    const name = String(body?.name || '').trim();

    const course = await _course.findByPk(courseId, {
      attributes: ['id', 'syllabus_id'],
    });

    if (!course) throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, 404);

    if (!name) throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NAME_REQUIRED, 400);

    const isRename = id !== undefined && id !== null && `${id}`.trim() !== '';

    if (isRename) {
      const transaction = await _gradingItem.sequelize.transaction();
      try {
        const itemId = Number(id);

        const rel = await _gradingItem.findByPk(itemId, {
          attributes: ['id', 'category_id'],
          transaction,
        });

        if (!rel)
          throw new AppError(ERROR_MESSAGES.GRADING_ITEM_NOT_FOUND, 404);
        const linkCount = await _courseGrading.count({
          where: {grading_item_id: itemId},
          transaction,
        });

        if (linkCount <= 1) {
          await _gradingItem.update({name}, {where: {id: itemId}, transaction});
          await transaction.commit();
          return {data: {id: itemId}};
        }

        const created = await _gradingItem.create(
          {
            syllabus_id: course.syllabus_id,
            name,
            category_id: rel.category_id,
          },
          {transaction}
        );

        const [affected] = await _courseGrading.update(
          {grading_item_id: created.id},
          {where: {course_id: course.id, grading_item_id: itemId}, transaction}
        );

        await _studentGrades.update(
          {grading_item_id: created.id},
          {where: {course_id: course.id, grading_item_id: itemId}, transaction}
        );

        if (!affected) {
          await _courseGrading.create(
            {
              course_id: course.id,
              grading_item_id: created.id,
              weight: 0,
            },
            {transaction}
          );
        }
        await transaction.commit();
        return {data: {id: created.id}};
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    if (!course.syllabus_id)
      throw new AppError(ERROR_MESSAGES.COURSE_HAS_NO_SYLLABUS, 400);

    const category = await _gradingCategory.findOne({
      where: {name: GRADING_CATEGORIES.ASSIGNMENT},
      attributes: ['id'],
    });

    if (!category)
      throw new AppError(ERROR_MESSAGES.ASSIGNMENT_CATEGORY_NOT_FOUND, 404);

    const transaction = await _gradingItem.sequelize.transaction();
    try {
      const created = await _gradingItem.create(
        {
          syllabus_id: course.syllabus_id,
          name,
          category_id: category.id,
        },
        {transaction}
      );

      await _courseGrading.create(
        {
          course_id: course.id,
          grading_item_id: created.id,
          weight: 0,
        },
        {transaction}
      );
      await transaction.commit();
      return {data: {id: created.id}};
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  });

  deleteCourseAssignmentItem = catchServiceAsync(async (courseId, itemId) => {
    const transaction = await _courseGrading.sequelize.transaction();
    const gi = await _gradingItem.findByPk(Number(itemId), {
      attributes: ['id', 'name', 'category_id'],
      transaction,
    });
    const rows = await _courseGrading.findAll({
      where: {course_id: Number(courseId)},
      include: [
        {
          model: _gradingItem,
          as: 'grading_item',
          attributes: ['id'],
          include: [
            {model: _gradingCategory, as: 'category', attributes: ['name']},
          ],
        },
      ],
      attributes: ['id'],
      transaction,
    });

    const ids = rows
      .filter(
        (r) => r.grading_item?.category?.name === GRADING_CATEGORIES.ASSIGNMENT
      )
      .map((r) => r.grading_item.id)
      .sort((a, b) => a - b);

    const idx = ids.indexOf(Number(itemId));
    if (idx === -1)
      throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND_IN_COURSE, 404);

    const right = ids.slice(idx + 1);

    const left = ids.slice(0, idx).reverse();

    let target = null;
    const candidates = [...right, ...left];
    if (candidates.length > 0) {
      const occupiedRows = await _studentGrades.findAll({
        where: {
          course_id: Number(courseId),
          grading_item_id: {[Op.in]: candidates},
        },
        attributes: ['grading_item_id'],
        raw: true,
        transaction,
      });
      const occupied = new Set(
        occupiedRows.map((r) => Number(r.grading_item_id))
      );
      target = candidates.find((id) => !occupied.has(Number(id))) || null;
    }
    if (!target) {
      const course = await _course.findByPk(Number(courseId), {
        attributes: ['id', 'syllabus_id'],
        transaction,
      });
      const category = await _gradingCategory.findOne({
        where: { name: GRADING_CATEGORIES.ASSIGNMENT },
        attributes: ['id'],
        transaction,
      });
      const created = await _gradingItem.create(
        {
          syllabus_id: course.syllabus_id,
          name: gi?.name || 'Assignment',
          category_id: category.id,
        },
        { transaction }
      );
      await _courseGrading.create(
        { course_id: Number(courseId), grading_item_id: created.id, weight: 0 },
        { transaction }
      );
      target = created.id;
    }
    try {
      await Promise.all([
        _studentGrades.update(
          {grading_item_id: target},
          {
            where: {course_id: Number(courseId), grading_item_id: Number(itemId)},
            transaction,
          }
        ),
        _courseGrading.destroy({
          where: {course_id: Number(courseId), grading_item_id: Number(itemId)},
          transaction,
        }),
      ]);

      const remaining = await _courseGrading.count({
        where: {grading_item_id: Number(itemId)},
        transaction,
      });

      if (remaining === 0) {
        await _gradingItem.destroy({where: {id: Number(itemId)}, transaction});
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    return {data: {shifted_to: target}};
  });

  deleteCourseAssignmentItemsBatch = catchServiceAsync(async (deletes) => {
    const transaction = await _courseGrading.sequelize.transaction();
    try {
      const results = [];
      for (const d of (Array.isArray(deletes) ? deletes : [])) {
        const courseId = Number(d.course_id);
        const itemId = Number(d.item_id);
        const gi = await _gradingItem.findByPk(itemId, {
          attributes: ['id', 'name', 'category_id'],
          transaction,
        });
        const rows = await _courseGrading.findAll({
          where: { course_id: courseId },
          include: [{
            model: _gradingItem,
            as: 'grading_item',
            attributes: ['id'],
            include: [{ model: _gradingCategory, as: 'category', attributes: ['name'] }],
          }],
          attributes: ['id'],
          transaction,
        });
        const ids = rows
          .filter((r) => r.grading_item?.category?.name === GRADING_CATEGORIES.ASSIGNMENT)
          .map((r) => r.grading_item.id)
          .sort((a, b) => a - b);
        const idx = ids.indexOf(itemId);
        if (idx === -1) continue;
        const candidates = [...ids.slice(idx + 1), ...ids.slice(0, idx).reverse()];
        let target = null;
        if (candidates.length > 0) {
          const occupiedRows = await _studentGrades.findAll({
            where: { course_id: courseId, grading_item_id: { [Op.in]: candidates } },
            attributes: ['grading_item_id'],
            raw: true,
            transaction,
          });
          const occupied = new Set(occupiedRows.map((r) => Number(r.grading_item_id)));
          target = candidates.find((id) => !occupied.has(Number(id))) || null;
        }
        if (!target) {
          const course = await _course.findByPk(courseId, {
            attributes: ['id', 'syllabus_id'],
            transaction,
          });
          const category = await _gradingCategory.findOne({
            where: { name: GRADING_CATEGORIES.ASSIGNMENT },
            attributes: ['id'],
            transaction,
          });
          const created = await _gradingItem.create(
            { syllabus_id: course.syllabus_id, name: gi?.name || 'Assignment', category_id: category.id },
            { transaction }
          );
          await _courseGrading.create(
            { course_id: courseId, grading_item_id: created.id, weight: 0 },
            { transaction }
          );
          target = created.id;
        }
        await Promise.all([
          _studentGrades.update(
            { grading_item_id: target },
            { where: { course_id: courseId, grading_item_id: itemId }, transaction }
          ),
          _courseGrading.destroy({ where: { course_id: courseId, grading_item_id: itemId }, transaction }),
        ]);
        const remaining = await _courseGrading.count({ where: { grading_item_id: itemId }, transaction });
        if (remaining === 0) {
          await _gradingItem.destroy({ where: { id: itemId }, transaction });
        }
        results.push({ course_id: courseId, item_id: itemId, shifted_to: target });
      }
      await transaction.commit();
      return { data: { results } };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  });

  getGradingPercentageBySyllabus = catchServiceAsync(async (syllabusId) => {
    validateParameters({
      syllabusId,
    });

    const response = await _gradePercentages.findOne({
      where: {syllabus_id: syllabusId},
    });

    return {
      data: response,
    };
  });
};
