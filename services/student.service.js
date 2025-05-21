const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters, generateCredentials } = require('../utils/utils');
const { or, Op } = require('sequelize');
let _user = null;
let _student = null;
let _course = null;
let _payment = null;
let _courseStudent = null;
let _userService = null;
let _professor = null;
let _level = null;
let _studentGrades = null;
let _sequelize = null;
let _syllabus = null;
let _gradePercentages = null;
module.exports = class StudentService extends BaseService {
  constructor({
    Sequelize,
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
  }) {
    super(Student);
    _sequelize = Sequelize;
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
  }

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
          ...(filters.name && {
            where: {
              name: { [Op.like]: `%${trimmedQuery.name}%` },
            },
          }),
          attributes: ['id', 'name', 'email', 'status', 'username', 'password'],
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
  };

  getStudent = catchServiceAsync(async (id) => {
    const student = await _student.findByPk(id, {
      include: [
        {
          model: _user,
          as: 'user',
          attributes: ['id', 'name', 'email', 'status', 'username'],
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
        user: {
          id: student.user.id,
          name: student.user.name,
          email: student.user.email,
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

    const { username, password } = generateCredentials(name, cedula);
    body.username = username;
    body.password = password;

    const userResponse = await _userService.createUser(body);

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
    body.role = 'student';
    const {
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

    await _courseStudent.create({
      course_id: parseInt(courseId),
      student_id: id,
      enrollment_date: new Date(),
    });

    const student = await _student.findByPk(id);

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    await _userService.updateUser(student.user_id, body);

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
          attributes: ['name', 'username', 'email', 'status'],
        },
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
      throw new AppError('Student not found', 404);
    }

    await _student.destroy({ where: { id } });
    await _user.destroy({ where: { id: student.user_id } });

    return { message: 'Student and associated user deleted successfully' };
  });

  getBestStudents = catchServiceAsync(async (query) => {
    const { course_id, level_id, limit = 10 } = query;

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

          const gradingItems = await _sequelize.models.grading_item.findAll({
            where: {
              category_id: 1,
              syllabus_id,
              name: { [Op.notLike]: '%(eliminado)%' },
            },
          });

          const testItems = await _sequelize.models.grading_item.findAll({
            where: {
              category_id: 2,
              syllabus_id,
              name: { [Op.notLike]: '%(eliminado)%' },
            },
          });

          const examItems = await _sequelize.models.grading_item.findAll({
            where: {
              category_id: 3,
              syllabus_id,
              name: { [Op.notLike]: '%(eliminado)%' },
            },
          });

          totalAssignmentsCount = gradingItems.length;
          totalTestItemsCount = testItems.length;
          totalExamItemsCount = examItems.length;
        }
      } catch (error) {}
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
              model: _sequelize.models.grading_item,
              as: 'grading_item',
              attributes: ['id', 'name', 'category_id'],
              include: [
                {
                  model: _sequelize.models.grading_category,
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
        (grade) => grade.grading_item?.category_id === 1
      );
      const testGrades = grades.filter(
        (grade) => grade.grading_item?.category_id === 2
      );
      const examGrades = grades.filter(
        (grade) => grade.grading_item?.category_id === 3
      );

      const sumGrades = (list) =>
        list.reduce((student, grade) => student + parseFloat(grade.grade || 0), 0);

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
};
