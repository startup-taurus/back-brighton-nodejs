const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const { validateParameters } = require('../utils/utils');
const AppError = require('../utils/app-error');
const { LEVEL_TO_EXAM_TYPE, EXAMS_TYPE, DELETED } = require('../utils/constants');
const { Op } = require('sequelize');
let _course = null;
let _syllabus = null;
let _gradingItem = null;
let _gradingCategory = null; 
let _syllabusItems = null;
let _gradePercentages = null;
let _courseGrading = null;
let _sequelize = null;
let _percentages = null;
let _level = null;
let _courseSchedule = null;
let _courseScheduleService = null;
let _categoryMap = null;

module.exports = class SyllabusService extends BaseService {
  constructor({
    Syllabus,
    SyllabusItems,
    GradePercentages,
    GradingItem,
    GradingCategory, 
    Course,
    CourseGrading,
    Percentages,
    Sequelize,
    Level,
    CourseSchedule,
    CourseScheduleService,
  }) {
    super(Syllabus.Syllabus);
    _course = Course.Course;
    _syllabus = Syllabus.Syllabus;
    _gradingItem = GradingItem.GradingItem;
    _gradingCategory = GradingCategory.GradingCategory;
    _syllabusItems = SyllabusItems.SyllabusItems;
    _gradePercentages = GradePercentages.GradePercentages;
    _courseGrading = CourseGrading.CourseGrading;
    _percentages = Percentages.Percentages;
    _sequelize = Sequelize;
    _level = Level.Level;
    _courseSchedule = CourseSchedule.CourseSchedule;
    _courseScheduleService = CourseScheduleService;
  }

  getCategoryMap = catchServiceAsync(async () => {
    if (!_categoryMap) {
      const categories = await _gradingCategory.findAll({
        attributes: ['id', 'name'],
        order: [['id', 'ASC']]
      });
      if (!categories?.length) {
        throw new AppError('No grading categories found in database', 500);
      }
      _categoryMap = categories.reduce((map, category) => {
        map[category.name] = category.id;
        return map;
      }, {});
    }
    return _categoryMap;
  });

  getCategoryId = async (categoryName) => {
    const categoryMap = await this.getCategoryMap();
    const categoryId = categoryMap[categoryName];
    
    if (!categoryId) {
      throw new AppError(`Category '${categoryName}' not found`, 404);
    }
    return categoryId;
  };

  getAllSyllabus = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10, ...filters } = query;
    
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);
    
    const trimmedQuery = {
      ...query,
      syllabus_name: query.syllabus_name?.trim(),
      level_id: query.level_id,
    };
    
    const whereConditions = {
      ...(filters.syllabus_name && {
        syllabus_name: { [Op.like]: `%${trimmedQuery.syllabus_name}%` }
      }),
      ...(filters.level_id && {
        level_id: trimmedQuery.level_id
      }),
    };
    
    const totalSyllabus = await _syllabus.count({ where: whereConditions });
    const syllabus = await _syllabus.findAndCountAll({
      where: whereConditions,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
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
        {
          model: _level,
          as: 'level',
          attributes: ['id', 'full_level'],
        },
      ],
      attributes: ['id', 'syllabus_name', 'exam_type'],
      order: [
        ['id', 'DESC'],
        [{ model: _syllabusItems, as: 'items' }, 'id', 'ASC'],
        [{ model: _gradingItem, as: 'grading_items' }, 'id', 'ASC']
      ],
    });
  
    if (!syllabus || syllabus.rows.length === 0) {
      return { data: { results: [], totalCount: 0 } };
    }
    
    const categoryMap = await this.getCategoryMap();
    
    const data = syllabus.rows.map((syllabus) => {
      const gradingItems = syllabus.grading_items || [];
  
      const assignments = gradingItems
        .filter((item) => item.category_id === categoryMap['ASSIGNMENTS'])
        .map((item) => item.name);
      const progressTests = gradingItems
        .filter((item) => item.category_id === categoryMap['PROGRESS TESTS'])
        .map((item) => item.name);
      const examModules = gradingItems
        .filter((item) => item.category_id === categoryMap['MOVERS EXAM'])
        .map((item) => item.name);
  
      return {
        id: syllabus.id,
        syllabus_name: syllabus.syllabus_name,
        exam_type: syllabus.exam_type,
        level: syllabus.level,
        items: syllabus.items,
        percentages: syllabus.percentages,
        assignments,
        progress_tests: progressTests,
        exam_modules: examModules,
        movers_exam: examModules,
        percentages_syllabus: syllabus.percentages_syllabus,
      };
    });
  
    return { data: { results: data, totalCount: totalSyllabus } };
  });

  getSyllabusById = catchServiceAsync(async (id) => {
    const syllabus = await _syllabus.findByPk(id, {
      include: [
        {
          model: _syllabusItems,
          as: 'items',
          attributes: ['id', 'item_name'],
          where: {
            item_name: { [Op.notLike]: `%${DELETED.DELETED_ITEM}%` },
          },
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
        {
          model: _level,
          as: 'level',
          attributes: ['id', 'full_level'],
        },
      ],
      attributes: ['id', 'syllabus_name', 'exam_type', 'level_id'], 
      order: [
        [{ model: _syllabusItems, as: 'items' }, 'id', 'ASC'],
        [{ model: _gradingItem, as: 'grading_items' }, 'id', 'ASC']
      ],
    });
    if (!syllabus) {
      throw new AppError('Syllabus not found', 404);
    }

    const categoryMap = await this.getCategoryMap();
    
    const gradingItems = syllabus.grading_items || [];
    const assignments = gradingItems
      .filter((item) => item.category_id === categoryMap['ASSIGNMENTS'])
      .map((item) => item.name);
    const progressTests = gradingItems
      .filter((item) => item.category_id === categoryMap['PROGRESS TESTS'])
      .map((item) => item.name);
    const examModules = gradingItems
      .filter((item) => item.category_id === categoryMap['MOVERS EXAM'])
      .map((item) => item.name);

    const formattedSyllabus = {
      id: syllabus.id,
      syllabus_name: syllabus.syllabus_name,
      exam_type: syllabus.exam_type,
      level: syllabus.level,
      items: syllabus.items,
      percentages: syllabus.percentages,
      assignments,
      progress_tests: progressTests,
      exam_modules: examModules,
      movers_exam: examModules,
      percentages_syllabus: syllabus.percentages_syllabus,
    };

    return { data: formattedSyllabus };
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
    level_id,
    exam_type,
  } = body;

  validateParameters({
    syllabus_name,
    assig_percentage,
    test_percentage,
    exam_percentage,
    percentages,
    level_id,
  });

  const existingSyllabus = await _syllabus.findOne({
    where: {
      syllabus_name: syllabus_name.trim()
    }
  });

  if (existingSyllabus) {
    throw new AppError('A syllabus with this name already exists. Please choose a different name.', 400);
  }

  const finalExamType = exam_type || LEVEL_TO_EXAM_TYPE[level_id] || 'PRELIM';

  const syllabus = await _syllabus.create({
    syllabus_name,
    level_id,
    exam_type: finalExamType,
  });

  if (items && items.length > 0) {
    const itemsToCreate = items.map((item) => ({
      syllabus_id: syllabus.id,
      item_name: item.trim()
    }));
    if (itemsToCreate.length > 0) {
      await _syllabusItems.bulkCreate(itemsToCreate);
    }
  }

  await _gradePercentages.create({
    syllabus_id: syllabus.id,
    assig_percentage,
    test_percentage,
    exam_percentage,
  });

  const categoryMap = await this.getCategoryMap();

  const gradingCategories = [
    { categoryId: categoryMap['ASSIGNMENTS'], items: assignments },
    { categoryId: categoryMap['PROGRESS TESTS'], items: progress_tests },
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

  if (finalExamType) {
    await this.createExamModulesByType(syllabus.id, finalExamType);
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

  syncSyllabusItemsWithCourseSchedules = catchServiceAsync(async (syllabusId, transaction) => {
    const coursesWithSyllabus = await _course.findAll({
      where: { syllabus_id: syllabusId },
      attributes: ['id'],
      transaction,
    });

    if (coursesWithSyllabus.length === 0) {
      return; 
    }

    const syllabusItems = await _syllabusItems.findAll({
      where: { 
        syllabus_id: syllabusId,
        item_name: { [Op.notLike]: `%${DELETED.DELETED_ITEM}%` },
      },
      order: [['id', 'ASC']],
      transaction,
    });

    for (const course of coursesWithSyllabus) {
      const existingSchedules = await _courseSchedule.findAll({
        where: { course_id: course.id },
        order: [['scheduled_date', 'ASC']],
        transaction,
      });

      if (!existingSchedules?.length) {
        continue;
      }

      const existingItemIds = new Set(existingSchedules.map(s => s.syllabus_item_id));
      
      const newItems = syllabusItems.filter(item => !existingItemIds.has(item.id));
      
      if (!newItems.length) {
        continue;
      }

      try {
        const lastSchedule = existingSchedules[existingSchedules.length - 1];
        const lastDate = new Date(lastSchedule.scheduled_date);
        
        if (isNaN(lastDate.getTime())) {
          console.error(`Invalid last scheduled date for course ${course.id}`);
          continue;
        }
        
        const courseInfo = await _course.findByPk(course.id, {
          attributes: ['schedule'],
          transaction,
        });
        
        const newSchedules = [];
        let currentDate = new Date(lastDate);
        
        for (let itemIndex = 0; itemIndex < newItems.length; itemIndex++) {
          currentDate.setDate(currentDate.getDate() + 1);
          
          while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          newSchedules.push({
            course_id: course.id,
            syllabus_item_id: newItems[itemIndex].id,
            scheduled_date: currentDate.toISOString().split('T')[0],
            lesson_taught: null,
          });
          
          currentDate = new Date(currentDate); 
        }
        
        if (newSchedules.length > 0) {
          await _courseSchedule.bulkCreate(newSchedules, { transaction });
          console.info(`Added ${newSchedules.length} new schedule items for course ${course.id}`);
        }
      } catch (error) {
        continue;
      }
    }
  });

  updateSyllabus = catchServiceAsync(async (id, body) => {
    return await _sequelize.transaction(async (transaction) => {
      const {
        syllabus_name,
        items,
        assig_percentage,
        test_percentage,
        exam_percentage,
        assignments,
        progress_tests,
        movers_exam,
        exam_modules,
        level_id,
        exam_type,
        percentages: bodyPercentages,
      } = body;

      const syllabus = await _syllabus.findByPk(id, {
        include: [
          { model: _syllabusItems, as: 'items' },
          { model: _gradePercentages, as: 'percentages' },
        ],
        transaction,
      });

      if (!syllabus) {
        throw new AppError('Syllabus not found', 404);
      }
 
      await syllabus.update(
        { syllabus_name, level_id, exam_type },
        { transaction }
      );

      const previousItemsCount = await _syllabusItems.count({
        where: { 
          syllabus_id: id,
          item_name: {
            [Op.notLike]: DELETED.DELETED_ITEM
          }
        },
        transaction,
      });

      if (items && Array.isArray(items)) {
        const currentItems = await _syllabusItems.findAll({
          where: { syllabus_id: id },
          order: [['id', 'ASC']],
          transaction,
        });
        
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
          if (itemIndex < currentItems.length) {
            await currentItems[itemIndex].update(
              { item_name: items[itemIndex].trim() },
              { transaction }
            );
          } else {
            await _syllabusItems.create(
              { syllabus_id: id, item_name: items[itemIndex].trim() },
              { transaction }
            );
          }
        }
        
        if (currentItems.length > items.length) {
          const itemsToDelete = currentItems.slice(items.length);
          for (const item of itemsToDelete) {
            await item.destroy({ transaction });
          }
        }

        const newItemsCount = items.length;
        if (newItemsCount > previousItemsCount) {
          await this.syncSyllabusItemsWithCourseSchedules(id, transaction);
        }
      }

      if (
        assig_percentage !== undefined &&
        test_percentage !== undefined &&
        exam_percentage !== undefined
      ) {
        const gradePercentageRecord = await _gradePercentages.findOne({
          where: { syllabus_id: id },
          transaction,
        });
        if (gradePercentageRecord) {
          await gradePercentageRecord.update(
            { assig_percentage, test_percentage, exam_percentage },
            { transaction }
          );
        } else {
          await _gradePercentages.create(
            {
              syllabus_id: id,
              assig_percentage,
              test_percentage,
              exam_percentage,
            },
            { transaction }
          );
        }
      }

      const gradingCategories = [
        { categoryId: 1, items: assignments },
        { categoryId: 2, items: progress_tests },
        { categoryId: 3, items: exam_modules || movers_exam },
      ];

      for (const { categoryId, items: categoryItems } of gradingCategories) {
        if (categoryItems && Array.isArray(categoryItems)) {
          const currentGradingItems = await _gradingItem.findAll({
            where: { syllabus_id: id, category_id: categoryId },
            order: [['id', 'ASC']],
            transaction,
          });

          for (let categoryItemIndex = 0; categoryItemIndex < categoryItems.length; categoryItemIndex++) {
            if (categoryItemIndex < currentGradingItems.length) {
              await currentGradingItems[categoryItemIndex].update(
                { name: categoryItems[categoryItemIndex] },
                { transaction }
              );
            } else {
              const newGradingItem = await _gradingItem.create(
                {
                  syllabus_id: id,
                  category_id: categoryId,
                  name: categoryItems[categoryItemIndex],
                },
                { transaction }
              );

              const coursesWithSyllabus = await _course.findAll({
                where: { syllabus_id: id },
                attributes: ['id'],
                transaction,
              });

              const courseGradingRecords = coursesWithSyllabus.map(
                (course) => ({
                  course_id: course.id,
                  grading_item_id: newGradingItem.id,
                  weight: 0,
                })
              );

              if (courseGradingRecords.length > 0) {
                await _courseGrading.bulkCreate(courseGradingRecords, {
                  transaction,
                });
              }
            }
          }

          if (currentGradingItems.length > categoryItems.length) {
            const itemsToDelete = currentGradingItems.slice(categoryItems.length);
            for (const item of itemsToDelete) {
              await _courseGrading.destroy({
                where: { grading_item_id: item.id },
                transaction,
              });

              await item.destroy({ transaction });
            }
          }
        }
      }

      if (bodyPercentages && Array.isArray(bodyPercentages)) {
        const currentPercentages = await _percentages.findAll({
          where: { syllabus_id: id },
          order: [['id', 'ASC']],
          transaction,
        });
        
        for (let percentageIndex = 0; percentageIndex < bodyPercentages.length; percentageIndex++) {
          const { name, min, max } = bodyPercentages[percentageIndex];
          if (percentageIndex < currentPercentages.length) {
            await currentPercentages[percentageIndex].update(
              { name, min, max },
              { transaction }
            );
          } else {
            await _percentages.create(
              { syllabus_id: id, name, min, max },
              { transaction }
            );
          }
        }
        
        if (currentPercentages.length > bodyPercentages.length) {
          for (
            let deletionIndex = bodyPercentages.length;
            deletionIndex < currentPercentages.length;
            deletionIndex++
          ) {
            await currentPercentages[deletionIndex].update(
              { name: currentPercentages[deletionIndex].name + DELETED.DELETED_ITEM },
              { transaction }
            );
          }
        }
      }

      return { data: syllabus };
    });
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

  creatAssignmentGradingItem = catchServiceAsync(async (body) => {
    const { syllabus_id, course_id, name } = body;
  
    validateParameters({ syllabus_id, name });
  
    return await _sequelize.transaction(async (transaction) => {
      const categoryMap = await this.getCategoryMap();
      
      const response = await _gradingItem.create(
        {
          category_id: categoryMap['ASSIGNMENTS'], 
          syllabus_id,
          name,
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
    });
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

  updateExamTypesByLevel = catchServiceAsync(async () => {
    return await _sequelize.transaction(async (transaction) => {
      const syllabi = await _syllabus.findAll({
        attributes: ['id', 'level_id', 'exam_type'],
        transaction,
      });
  
      const updates = [];
  
      for (const syllabus of syllabi) {
        const correctExamType = LEVEL_TO_EXAM_TYPE[syllabus.level_id];
  
        if (correctExamType && syllabus.exam_type !== correctExamType) {
          updates.push(
            _syllabus.update(
              { exam_type: correctExamType },
              {
                where: { id: syllabus.id },
                transaction,
              }
            )
          );
        }
      }
  
      await Promise.all(updates);
  
      return {
        success: true,
        message: `Updated ${updates.length} syllabi with correct exam types`,
        updatedCount: updates.length,
      };
    });
  });

  getExamTypeByLevel = (levelId) => {
    return LEVEL_TO_EXAM_TYPE[levelId] || 'PRELIM';
  };

  createExamModulesByType = catchServiceAsync(async (syllabusId, examType) => {
    const modulesByType = {
      [EXAMS_TYPE.STARTERS]: [
        { name: 'READING & WRITING', category_id: 3 },
        { name: 'LISTENING', category_id: 3 },
        { name: 'SPEAKING', category_id: 3 },
      ],
      [EXAMS_TYPE.MOVERS]: [
        { name: 'READING & WRITING', category_id: 3 },
        { name: 'LISTENING', category_id: 3 },
        { name: 'SPEAKING', category_id: 3 },
      ],
      [EXAMS_TYPE.FLYERS]: [
        { name: 'READING & WRITING', category_id: 3 },
        { name: 'LISTENING', category_id: 3 },
        { name: 'SPEAKING', category_id: 3 },
      ],
      [EXAMS_TYPE.KEY]: [
        { name: 'READING & WRITING', category_id: 3 },
        { name: 'LISTENING', category_id: 3 },
        { name: 'SPEAKING', category_id: 3 },
      ],
      [EXAMS_TYPE.PRELIM]: [
        { name: 'READING', category_id: 3 },
        { name: 'LISTENING', category_id: 3 },
        { name: 'WRITING', category_id: 3 },
        { name: 'SPEAKING', category_id: 3 },
      ],
      [EXAMS_TYPE.FIRST]: [
        { name: 'READING', category_id: 3 },
        { name: 'LISTENING', category_id: 3 },
        { name: 'WRITING', category_id: 3 },
        { name: 'SPEAKING', category_id: 3 },
      ],
    };

    const modules = modulesByType[examType] || modulesByType[EXAMS_TYPE.PRELIM];

    const gradingItems = modules.map((module) => ({
      ...module,
      syllabus_id: syllabusId,
    }));

    if (gradingItems.length > 0) {
      await _gradingItem.bulkCreate(gradingItems);
    }

    return { success: true, modulesCreated: gradingItems.length };
  });
};