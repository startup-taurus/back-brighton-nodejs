const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters, generateCredentials, validateEmailFormat } = require('../utils/utils');
const { Op } = require('sequelize');
const { ERROR_MESSAGES, GRADING_CATEGORIES, DELETED } = require('../utils/constants');
let _user = null;
let _student = null;
let _course = null;
let _payment = null;
let _courseStudent = null;
let _userService = null;
let _professor = null;
let _level = null;
let _studentGrades = null;
let _syllabus = null;
let _gradePercentages = null;
let _gradingCategory = null;
let _gradingItem = null;
let _studentTransfer = null;
let _transferData = null;

module.exports = class StudentService extends BaseService {
  constructor({
    User,
    Student,
    Course,
    Payment,
    CourseStudent,
    UserService,
    Professor,
    Level,
    StudentGrades,
    Syllabus,
    GradePercentages,
    GradingCategory,
    GradingItem,
    StudentTransfer,
    TransferData,
  }) {
    super(Student);
    _user = User.User;
    _student = Student.Student;
    _course = Course.Course;
    _payment = Payment.Payment;
    _courseStudent = CourseStudent.CourseStudent;
    _userService = UserService;
    _professor = Professor.Professor;
    _level = Level.Level;
    _studentGrades = StudentGrades.StudentGrades;
    _syllabus = Syllabus.Syllabus;
    _gradePercentages = GradePercentages.GradePercentages;
    _gradingCategory = GradingCategory.GradingCategory;
    _gradingItem = GradingItem.GradingItem;
    _studentTransfer = StudentTransfer.StudentTransfer;
    _transferData = TransferData.TransferData;
    
    this.categoryIds = null;
  }

  getCategoryIds = catchServiceAsync(async () => {
    if (this.categoryIds) {
      return this.categoryIds;
    }

    const categories = await _gradingCategory.findAll({
      attributes: ['id', 'name'],
      raw: true
    });

    this.categoryIds = {
      assignment: categories.find(c => c.name === GRADING_CATEGORIES.ASSIGNMENT)?.id,
      test: categories.find(c => c.name === GRADING_CATEGORIES.TEST)?.id,
      exam: categories.find(c => c.name === GRADING_CATEGORIES.EXAM)?.id
    };

    return this.categoryIds;
  });

  getAllStudents = async (query) => {
    const { page = 1, limit = 10, ...filters } = query;

    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    const trimmedQuery = {
      ...query,
      status: query.status?.trim(),
      promotion: query.promotion?.trim(),
      level_id: query.level_id,
      cedula: query.cedula?.trim(),
      name: query.name?.trim(),
    };

    let studentIds = [];
    if (query.course) {
      const courseStudents = await _courseStudent.findAll({
        where: { course_id: query.course },
        attributes: ['student_id'],
        raw: true,
      });
      studentIds = courseStudents.map((cs) => cs.student_id);

      if (studentIds.length === 0) {
        return {
          data: {
            result: [],
            totalCount: 0,
          },
        };
      }
    }

    const data = await _student.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      where: {
        status: { [Op.ne]: 'deleted' }, 
        ...(filters.status && { status: trimmedQuery.status }),
        ...(filters.promotion && {
          promotion: { [Op.like]: `%${trimmedQuery.promotion}%` },
        }),
        ...(filters.level_id && {
          level_id: trimmedQuery.level_id,
        }),
        ...(filters.cedula && {
          cedula: { [Op.like]: `%${trimmedQuery.cedula}%` },
        }),
        ...(studentIds.length > 0 && { id: { [Op.in]: studentIds } }),
      },
      include: [
        {
          model: _user,
          as: 'user',
          where: {
            isActive: 1, 
            ...(filters.name && {
              name: { [Op.like]: `%${trimmedQuery.name}%` },
            }),
          },
          attributes: ['id', 'name', 'email', 'status', 'username', 'password', 'first_name', 'middle_name', 'last_name', 'second_last_name'],
        },
        {
          model: _payment,
          as: 'payment',
          attributes: ['payment_date', 'total_payment', 'payment_method'],
        },
        {
          model: _level,
          as: 'level',
          attributes: ['id', 'full_level'],
        },
      ],
      order: [['id', 'DESC']],
    });

    let formattedRows = data?.rows?.map((row) => row.toJSON());

    for (const student of formattedRows) {
      const courseStudents = await _courseStudent.findAll({
        where: {
          student_id: student.id,
          ...(query.course && { course_id: query.course }),
        },
        limit: 2,
        include: [
          {
            model: _course,
            as: 'course',
            required: true,
            include: [
              {
                model: _professor,
                as: 'professor',
                include: [
                  {
                    model: _user,
                    as: 'user',
                    attributes: ['id', 'name'],
                  },
                ],
              },
            ],
          },
        ],
        order: [['enrollment_date', 'DESC']],
      });

      student.course = courseStudents
        .map((cs) => {
          const courseJson = cs.toJSON();
          return {
            id: courseJson.course?.id,
            course_student_id: courseJson.id,
            course_name: courseJson.course?.course_name,
            course_number: courseJson.course?.course_number,
            professor: courseJson.course?.professor?.user?.name,
            enrollment_date: courseJson.enrollment_date,
          };
        })
        .filter((c) => c.id);
    }

    return {
      data: {
        result: formattedRows.map((student) => ({
          id: student.id,
          cedula: student.cedula,
          phone_number: student.phone_number,
          level_id: student.level_id,
          level: student.level
            ? {
                id: student.level.id,
                name: student.level.full_level,
              }
            : null,
          status: student.status,
          observations: student.observations,
          emergency_contact_name: student.emergency_contact_name,
          emergency_contact_phone: student.emergency_contact_phone,
          emergency_contact_relationship:
            student.emergency_contact_relationship,
          pending_payments: student.pending_payments,
          profession: student.profession,
          book_given: student.book_given,
          promotion: student.promotion,
          age_category: student.age_category,
          birth_date: student.birth_date,
          user: {
            id: student.user.id,
            name: student.user.name,
            email: student.user.email,
            status: student.user.status,
            username: student.user.username,
          },
          course: student.course || [],
          payments: Array.isArray(student.payment)
            ? student.payment.map((payment) => ({
                payment_date: payment.payment_date,
                total_payment: payment.total_payment,
                payment_method: payment.payment_method,
              }))
            : [],
        })),
        totalCount: data.count,
      },
    };
  }

  getStudent = catchServiceAsync(async (id) => {
    const student = await _student.findByPk(id, {
      include: [ 
        {
          model: _user,
          as: 'user',
          attributes: ['id', 'name', 'email', 'status', 'username', 'password', 'first_name', 'middle_name', 'last_name', 'second_last_name'],
        },
        {
          model: _level,
          as: 'level',
          attributes: ['id', 'full_level'],
        },
      ],
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const courseStudents = await _courseStudent.findAll({
      where: {
        student_id: student.id,
      },
      limit: 2,
      include: [
        {
          model: _course,
          as: 'course',
          required: true,
          include: [
            {
              model: _professor,
              as: 'professor',
              include: [
                {
                  model: _user,
                  as: 'user',
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
        },
      ],
      order: [['enrollment_date', 'DESC']],
    });

    const courses = courseStudents
      .map((cs) => {
        const courseJson = cs.toJSON();
        return {
          id: courseJson.course?.id,
          course_student_id: courseJson.id,
          course_name: courseJson.course?.course_name,
          course_number: courseJson.course?.course_number,
          professor: courseJson.course?.professor?.user?.name,
          enrollment_date: courseJson.enrollment_date,
        };
      })
      .filter((c) => c.id);

    return {
      data: {
        id: student.id,
        cedula: student.cedula,
        phone_number: student.phone_number,
        level_id: student.level_id,
        level: student.level
          ? {
              id: student.level.id,
              name: student.level.full_level,
            }
          : null,
        status: student.status,
        observations: student.observations,
        emergency_contact_name: student.emergency_contact_name,
        emergency_contact_phone: student.emergency_contact_phone,
        emergency_contact_relationship: student.emergency_contact_relationship,
        age_category: student.age_category,
        birth_date: student.birth_date,
        pending_payments: student.pending_payments,
        promotion: student.promotion,
        book_given: student.book_given,
        course: courses, 
        user: {
          id: student.user.id,
          name: student.user.name,
          email: student.user.email,
          first_name: student.user.first_name,
          middle_name: student.user.middle_name,
          last_name: student.user.last_name,
          second_last_name: student.user.second_last_name,
        },
      },
    };
  });

  createStudent = catchServiceAsync(async (body) => {
    body.role = 'student';
    const {
      name,
      cedula,
      courseId,
      level_id,
      profession,
      book_given,
      observations,
      status,
      pending_payments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      promotion,
      age_category,
      birth_date,
      phone_number,
    } = body;
    
    validateParameters({
      name,
      cedula,
      status,
      course: courseId,
    });

    await this.validateDuplicates(body.email, cedula);

    const { username, password } = generateCredentials(name, cedula);
    body.username = username;
    body.password = password;

    const userResponse = await _userService.createUser(body, null, false, true);
    
    const user = userResponse.data;

    const student = await _student.create({
      user_id: user.id,
      cedula,
      profession,
      level_id,
      status,
      book_given,
      age_category,
      birth_date,
      pending_payments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      promotion,
      phone_number,
      observations,
    });

    if (courseId) {
      await _courseStudent.create({
        course_id: parseInt(courseId),
        student_id: student.id,
        enrollment_date: new Date(),
      });
    }

    return { data: student };
  });

  updateStudent = catchServiceAsync(async (id, body) => {
    const {
      name,
      first_name,
      middle_name,
      last_name,
      second_last_name,
      email,
      cedula,
      phone_number,
      level_id,
      status,
      promotion,
      book_given,
      pending_payments,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      age_category,
      birth_date,
      courseId,
    } = body;
  
    await _courseStudent.destroy({
      where: { student_id: id }
    });
  
    await _courseStudent.create({
      course_id: parseInt(courseId),
      student_id: id,
      enrollment_date: new Date(),
    });
  
    const student = await _student.findByPk(id, {
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['id', 'name', 'username', 'email', 'role', 'status', 'first_name', 'middle_name', 'last_name', 'second_last_name'],
        },
      ],
    });
  
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    if (name || email || first_name || middle_name || last_name || second_last_name) {
      const userUpdateData = {
        name: name || student.user.name,
        first_name: first_name || student.user.first_name,
        middle_name: middle_name || student.user.middle_name,
        last_name: last_name || student.user.last_name,
        second_last_name: second_last_name || student.user.second_last_name,
        username: student.user.username, 
        email: email || student.user.email,
        role: student.user.role, 
        status: student.user.status,
      };
      
      await _userService.updateUser(student.user_id, userUpdateData);
    }
  
    await _student.update(
      {
        cedula,
        phone_number,
        level_id,
        status,
        book_given,
        pending_payments,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        promotion,
        age_category,
        birth_date,
      },
      { where: { id } }
    );
  
    const updatedStudent = await _student.findByPk(id, {
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['name', 'username', 'email', 'status', 'first_name', 'middle_name', 'last_name', 'second_last_name'],
        },
        {
          model: _course,
          as: 'course',
          through: { attributes: [] },
          include: [
            {
              model: _professor,
              as: 'professor',
              include: [
                {
                  model: _user,
                  as: 'user',
                  attributes: ['name']
                }
              ]
            }
          ]
        }
      ],
    });
  
    return { data: updatedStudent };
  });

  updateStudentStatus = catchServiceAsync(async (id, body) => {
    const { status } = body;
    validateParameters({ id, status });
    const student = await _student.update({ status }, { where: { id } });
    return { data: student };
  });

  deleteStudent = catchServiceAsync(async (id) => {
    const student = await _student.findByPk(id);

    if (!student) {
      throw new AppError(ERROR_MESSAGES.STUDENT_NOT_FOUND, 404);
    }

    await _user.update(
      { isActive: 0 },
      { where: { id: student.user_id } }
    );

    return { message: 'Student and associated user deleted successfully' };
  });

  getBestStudents = catchServiceAsync(async (query) => {
    const { course_id, level_id, limit = 10 } = query;
    const categoryIds = await this.getCategoryIds();

    let studentWhereConditions = { status: 'active' };
    if (level_id) {
      studentWhereConditions.level_id = level_id;
    }

    let courseStudentWhereConditions = { is_retired: false };
    if (course_id) {
      courseStudentWhereConditions.course_id = course_id;
    }

    let totalAssignmentsCount = 0;
    let totalTestItemsCount = 0;
    let totalExamItemsCount = 0;

    if (course_id) {
      try {
        const courseData = await _course.findByPk(course_id, {
          include: [{ model: _syllabus, as: 'syllabus', attributes: ['id'] }],
        });

        if (courseData?.syllabus) {
          const syllabus_id = courseData.syllabus.id;

          const gradingItems = await _gradingItem.findAll({
            where: {
              category_id: categoryIds.assignment,
              syllabus_id,
              name: { [Op.notLike]: `%${DELETED.DELETED_ITEM}%` },
            },
          });

          const testItems = await _gradingItem.findAll({
            where: {
              category_id: categoryIds.test,
              syllabus_id,
              name: { [Op.notLike]: `%${DELETED.DELETED_ITEM}%` },
            },
          });

          const examItems = await _gradingItem.findAll({
            where: {
              category_id: categoryIds.exam,
              syllabus_id,
              name: { [Op.notLike]: `%${DELETED.DELETED_ITEM}%` },
            },
          });

          totalAssignmentsCount = gradingItems.length;
          totalTestItemsCount = testItems.length;
          totalExamItemsCount = examItems.length;
        }
      } catch (error) {
        throw new AppError('Error fetching grading items', 500);
      }
    }

    const students = await _student.findAll({
      where: studentWhereConditions,
      include: [
        { model: _user, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: _level, as: 'level', attributes: ['id', 'full_level'] },
        {
          model: _courseStudent,
          as: 'coursesStudent',
          where: courseStudentWhereConditions,
          include: [
            {
              model: _course,
              as: 'course',
              include: [
                {
                  model: _professor,
                  as: 'professor',
                  include: [
                    { model: _user, as: 'user', attributes: ['id', 'name'] },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: _studentGrades,
          as: 'student_grades_overall',
          attributes: ['id', 'grade', 'grading_item_id', 'course_id'],
          include: [
            {
              model: _gradingItem,
              as: 'grading_item',
              attributes: ['id', 'name', 'category_id'],
              include: [
                {
                  model: _gradingCategory,
                  as: 'category',
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
        },
      ],
    });

    const maxAssign = totalAssignmentsCount * 10;
    const maxTest = totalTestItemsCount * 10;
    const maxExam = totalExamItemsCount * 10;

    const studentsWithAverage = students.map((student) => {
      const dataStudent = student.toJSON();
      const grades = dataStudent.student_grades_overall || [];

      const assignmentGrades = grades.filter(
        (grade) => grade.grading_item?.category_id === categoryIds.assignment
      );
      const testGrades = grades.filter(
        (grade) => grade.grading_item?.category_id === categoryIds.test
      );
      const examGrades = grades.filter(
        (grade) => grade.grading_item?.category_id === categoryIds.exam
      );

      const sumGrades = (list) =>
        list.reduce((sum, grade) => sum + parseFloat(grade.grade || 0), 0);

      const assignmentSum = sumGrades(assignmentGrades);
      const testSum = sumGrades(testGrades);
      const examSum = sumGrades(examGrades);

      const assignmentPct = maxAssign ? (assignmentSum / maxAssign) * 100 : 0;
      const testPct = maxTest ? (testSum / maxTest) * 100 : 0;
      const examPct = maxExam ? (examSum / maxExam) * 100 : 0;

      const assignment_percent = assignmentPct.toFixed(2) + '%';
      const test_percent = testPct.toFixed(2) + '%';
      const exam_percent = examPct.toFixed(2) + '%';

      const totalPctNumeric =
        assignmentPct * 0.1 + testPct * 0.2 + examPct * 0.7;
      const total_percent = totalPctNumeric.toFixed(2) + '%';

      const avg = (list) => (list.length ? sumGrades(list) / list.length : 0);
      const assignmentAvg = avg(assignmentGrades);
      const testAvg = avg(testGrades);
      const examAvg = avg(examGrades);

      const average_grade = assignmentAvg * 0.1 + testAvg * 0.2 + examAvg * 0.7;

      let status = 'NOT REPORTED';
      if (grades.length) {
        status =
          average_grade >= 7.0
            ? 'PASS (A2)'
            : average_grade >= 5.0
            ? 'PASS'
            : 'FAIL';
      }

      const courseInfo = dataStudent.coursesStudent?.[0]?.course || null;

      return {
        id: dataStudent.id,
        name: dataStudent.user.name,
        email: dataStudent.user.email,
        cedula: dataStudent.cedula,
        level: dataStudent.level?.full_level || null,
        level_id: dataStudent.level_id,
        course_id: courseInfo?.id || null,
        course_name: courseInfo?.course_name || null,
        course_number: courseInfo?.course_number || null,
        professor: courseInfo?.professor?.user.name || 'Sin profesor',
        assignment_percent,
        test_percent,
        exam_percent,
        total_percent,
        average_grade: average_grade.toFixed(2),
        status,
        assignment_count: totalAssignmentsCount,
        test_count: totalTestItemsCount,
        exam_count: totalExamItemsCount,
        grades_count: grades.length,
      };
    });

    const sortedStudents = studentsWithAverage
      .sort((a, b) => parseFloat(b.average_grade) - parseFloat(a.average_grade))
      .slice(0, parseInt(limit, 10));

    return {
      data: {
        result: sortedStudents,
        totalCount: sortedStudents.length,
      },
    };
  });

  validateDuplicates = catchServiceAsync(async (email, cedula) => {
    validateParameters({ email, cedula });
    
    const emailValidation = validateEmailFormat(email);
    if (!emailValidation.isValid) {
      throw new AppError(emailValidation.message, 400);
    }
    
    const [existingEmailUser, existingCedulaStudent] = await Promise.all([
      _user.findOne({
        where: { email },
        attributes: ['id', 'email'],
        raw: true
      }),
      _student.findOne({
        where: { cedula },
        attributes: ['id', 'cedula'],
        raw: true
      })
    ]);
    
    const duplicateEmail = !!existingEmailUser;
    const duplicateCedula = !!existingCedulaStudent;
    
    if (duplicateEmail && duplicateCedula) {
      throw new AppError(ERROR_MESSAGES.EMAIL_CEDULA_ALREADY_REGISTERED, 400);
    }
    
    if (duplicateEmail) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED, 400);
    }
    
    if (duplicateCedula) {
      throw new AppError(ERROR_MESSAGES.CEDULA_ALREADY_REGISTERED, 400);
    }
  });
  transferAndProgressStudents = catchServiceAsync(async (studentIds, courseId, levelId) => {
    if (!studentIds?.length) throw new AppError('Student IDs are required', 400);
    if (!courseId && !levelId) throw new AppError(ERROR_MESSAGES.TRANSFER_VALIDATION, 400);

    const parsedStudentIds = studentIds.map(id => {
      const parsed = parseInt(id);
      if (isNaN(parsed)) throw new AppError(`Invalid student ID: ${id}`, 400);
      return parsed;
    });

    const parsedCourseId = courseId ? parseInt(courseId) : null;
    const parsedLevelId = levelId ? parseInt(levelId) : null;
    if (courseId && isNaN(parsedCourseId)) throw new AppError(`Invalid course ID: ${courseId}`, 400);
    if (levelId && isNaN(parsedLevelId)) throw new AppError(`Invalid level ID: ${levelId}`, 400);

    const transaction = await _student.sequelize.transaction();

    try {
      const students = await _student.findAll({
        where: { id: parsedStudentIds },
        include: [{ model: _user, as: 'user', attributes: ['isActive'], required: true }],
        transaction
      });

      if (students.length !== parsedStudentIds.length) {
        const foundIds = students.map(s => s.id);
        const missingIds = parsedStudentIds.filter(id => !foundIds.includes(id));
        throw new AppError(`Students not found: ${missingIds.join(', ')}`, 404);
      }

      const inactiveStudents = students.filter(s => !s.user?.isActive);
      if (inactiveStudents.length > 0) {
        throw new AppError(`Cannot transfer inactive students: ${inactiveStudents.map(s => s.id).join(', ')}`, 400);
      }

      if (parsedCourseId) {
        const course = await _course.findByPk(parsedCourseId, { transaction });
        if (!course) throw new AppError(`Course with ID ${parsedCourseId} not found`, 404);
      }

      if (parsedLevelId) {
        const level = await _level.findByPk(parsedLevelId, { transaction });
        if (!level) throw new AppError(`Level with ID ${parsedLevelId} not found`, 404);
      }
      let effectiveLevelId = parsedLevelId;
      if (!effectiveLevelId && course?.syllabus_id) {
        const syllabus = await _syllabus.findByPk(course.syllabus_id, { transaction });
        effectiveLevelId = syllabus?.level_id || null;
      }

      const transferData = await _transferData.create({
        selected_course_id: parsedCourseId,
        selected_level_id: effectiveLevelId,
        status_level_change: 'approved',
        description: `Transfer and progress for ${parsedStudentIds.length} student(s)`,
        is_group: parsedStudentIds.length > 1,
        created_by_id: null,
      }, { transaction });

      await _studentTransfer.bulkCreate(
        parsedStudentIds.map(studentId => ({
          student_id: studentId,
          transfer_data_id: transferData.id,
        })),
        { transaction }
      );

      for (const studentId of parsedStudentIds) {
        if (effectiveLevelId) {
          await _student.update({ level_id: effectiveLevelId }, { where: { id: studentId }, transaction });
        }
        if (parsedCourseId) {
          await _courseStudent.update(
            { is_retired: true },
            { where: { student_id: studentId, is_retired: false }, transaction }
          );

          await _courseStudent.create({
            student_id: studentId,
            course_id: parsedCourseId,
            enrollment_date: new Date(),
            is_retired: false,
          }, { transaction });
        }
      }
      await transaction.commit();
      const updatedStudents = await _student.findAll({
        where: { id: parsedStudentIds },
        include: [
          { model: _user, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: _level, as: 'level', attributes: ['id', 'full_level'] },
          {
            model: _courseStudent,
            as: 'coursesStudent',
            where: { is_retired: false },
            required: false,
            include: [{ model: _course, as: 'course', attributes: ['id', 'course_name', 'course_number'] }],
          },
        ],
      });
      return {
        data: {
          message: 'Students transferred and progressed successfully',
          students: updatedStudents,
          transfer_data: {
            id: transferData.id,
            status_level_change: 'approved',
            selected_course_id: parsedCourseId,
            selected_level_id: effectiveLevelId,
          },
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error instanceof AppError ? error : new AppError(`${ERROR_MESSAGES.PROGRESS_ERROR}: ${error.message}`, 500);
    }
  });
};
