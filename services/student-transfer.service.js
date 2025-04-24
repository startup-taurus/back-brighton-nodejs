const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters } = require('../utils/utils');
const catchServiceAsync = require('../utils/catch-service-async');

let _studentTransfer,
  _student,
  _user,
  _transferData,
  _course,
  _professor,
  _courseStudent,
  _level;

module.exports = class StudentTransferService extends BaseService {
  constructor({
    StudentTransfer,
    Student,
    User,
    TransferData,
    Course,
    Professor,
    CourseStudent,
    Level,
  }) {
    super(StudentTransfer);
    _studentTransfer = StudentTransfer.StudentTransfer;
    _student = Student.Student;
    _user = User.User;
    _transferData = TransferData.TransferData;
    _course = Course.Course;
    _professor = Professor.Professor;
    _courseStudent = CourseStudent.CourseStudent;
    _level = Level.Level;
  }

  /**
   * Listar todas las asociaciones Student–TransferData
   * con paginación y opcional filtro por transfer_data_id
   */
  getAllStudentTransfers = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10, transfer_data_id } = query;
    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);

    const where = {};
    if (transfer_data_id) where.transfer_data_id = transfer_data_id;

    const { count, rows } = await _studentTransfer.findAndCountAll({
      where,
      include: [
        {
          model: _student,
          as: 'student',
          attributes: ['id', 'cedula', 'phone_number', 'status'],
          include: [
            {
              model: _user,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
        {
          model: _transferData,
          as: 'transfer_data',
          attributes: [
            'id',
            'selected_course_id',
            'selected_level_id',
            'status_level_change',
            'description',
            'is_group',
          ],
        },
      ],
      limit: limitNum,
      offset: limitNum * (pageNum - 1),
      order: [['student_id', 'ASC']],
    });

    return {
      data: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    };
  });

  /**
   * Obtener una asociación por su ID
   */
  getStudentTransfer = catchServiceAsync(async (id) => {
    if (!id) throw new AppError('Id must be sent', 400);

    const st = await _studentTransfer.findOne({
      where: { id },
      include: [
        {
          model: _student,
          as: 'student',
          attributes: ['id', 'cedula', 'phone_number', 'status', 'level_id'],
          include: [
            {
              model: _user,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
        {
          model: _transferData,
          as: 'transfer_data',
          attributes: [
            'id',
            'selected_course_id',
            'selected_level_id',
            'status_level_change',
            'description',
            'is_group',
          ],
        },
      ],
    });

    if (!st) throw new AppError('Student transfer not found', 404);
    return st;
  });

  getStudentTransfersByTransferDataId = catchServiceAsync(
    async (transfer_data_id) => {
      if (!transfer_data_id)
        throw new AppError('Transfer data id must be sent', 400);

      const sts = await _studentTransfer.findAll({
        where: { transfer_data_id },
        include: [
          {
            model: _student,
            as: 'student',
            attributes: ['id', 'cedula', 'phone_number', 'status', 'level_id'],
            include: [
              {
                model: _user,
                as: 'user',
                attributes: ['id', 'name', 'email'],
              },
              {
                model: _courseStudent,
                as: 'coursesStudent',
                required: false,
                include: [
                  {
                    model: _course,
                    as: 'course',
                    required: false,
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
              },
              {
                model: _level,
                as: 'level',
                attributes: ['id', 'full_level'],
              },
            ],
          },
          {
            model: _transferData,
            as: 'transfer_data',
            attributes: [
              'id',
              'selected_course_id',
              'selected_level_id',
              'status_level_change',
              'description',
              'is_group',
            ],
          },
        ],
      });

      const dataFormatted = sts.map((record) => {
        const recordJson = record.toJSON();
        const student = recordJson.student;
        const transferData = recordJson.transfer_data;

        const courses = (student.coursesStudent || [])
          .map((cs) => ({
            course_id: cs.course?.id,
            course_number: cs.course?.course_number,
            course_name: cs.course?.course_name,
            schedule: cs.course?.schedule,
            professor_name: cs.course?.professor?.user?.name,
          }))
          .filter((c) => !!c.course_id);

        const selectedCourse = courses.find(
          (c) => c.course_id === transferData?.selected_course_id
        );

        const levelLabel = student.level?.full_level || null;

        return {
          ...recordJson,
          student: {
            ...student,
            course: courses,
            level: student.level
              ? { id: student.level.id, name: student.level.full_level }
              : null,
          },
          transfer_data: {
            ...transferData,
            selected_course_id: transferData?.selected_course_id || null,
            selected_level_id: transferData?.selected_level_id || null,
            selected_course:
              selectedCourse ||
              (transferData.selected_course_id
                ? {
                    label: `ID ${transferData.selected_course_id}`,
                    value: transferData.selected_course_id,
                  }
                : null),
            selected_level:
              levelLabel && transferData?.selected_level_id
                ? {
                    label: levelLabel,
                    value: transferData.selected_level_id,
                  }
                : null,
          },
        };
      });

      return { data: dataFormatted };
    }
  );

  createStudentTransfer = catchServiceAsync(async (body = {}) => {
    const { student_id, transfer_data_id } = body;

    validateParameters({ student_id, transfer_data_id });

    const student = await _student.findByPk(student_id);
    if (!student) throw new AppError('Student not found', 404);

    const td = await _transferData.findByPk(transfer_data_id);
    if (!td) throw new AppError('Transfer data not found', 404);

    const exists = await _studentTransfer.findOne({
      where: { student_id, transfer_data_id },
    });
    if (exists) throw new AppError('Student is already in this transfer', 400);

    const newST = await _studentTransfer.create({
      student_id,
      transfer_data_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const result = await this.getStudentTransfer(newST.id);
    return { data: result };
  });

  deleteStudentTransfer = catchServiceAsync(async (id) => {
    if (!id) throw new AppError('Id must be sent', 400);

    const st = await _studentTransfer.findByPk(id);
    if (!st) throw new AppError('Student transfer not found', 404);

    await _studentTransfer.destroy({ where: { id } });
    return { message: 'Student transfer deleted successfully' };
  });

  deleteStudentFromTransfer = catchServiceAsync(
    async (student_id, transfer_data_id) => {
      if (!student_id || !transfer_data_id) {
        throw new AppError('Student id and transfer data id must be sent', 400);
      }

      const st = await _studentTransfer.findOne({
        where: { student_id, transfer_data_id },
      });
      if (!st) throw new AppError('Student transfer not found', 404);

      await _studentTransfer.destroy({
        where: { student_id, transfer_data_id },
      });
      return { message: 'Student removed from transfer successfully' };
    }
  );
};
