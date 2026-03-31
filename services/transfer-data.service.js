const { Op, col } = require('sequelize');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters } = require('../utils/utils');
const { ALLOWED_STATUS } = require('../utils/constants');
const catchServiceAsync = require('../utils/catch-service-async');

let _user = null;
let _student = null;
let _level = null;
let _course = null;
let _sequelize = null;
let _transferData = null;
let _studentTransfer = null;
let _courseStudent = null;
let _professor = null;

module.exports = class TransferDataService extends BaseService {
  constructor({
    TransferData,
    Course,
    Level,
    User,
    Sequelize,
    StudentTransfer,
    CourseStudent,
    Student,
    Professor,
  }) {
    super(TransferData);
    _transferData = TransferData.TransferData;
    _course = Course.Course;
    _level = Level.Level;
    _user = User.User;
    _sequelize = Sequelize;
    _studentTransfer = StudentTransfer.StudentTransfer;
    _courseStudent = CourseStudent.CourseStudent;
    _student = Student.Student;
    _professor = Professor.Professor;
  }

  getAllTransferData = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10, ...filters } = query;
    const limitNumber = parseInt(limit, 10);
    const pageNumber = parseInt(page, 10);

    const trimmedQuery = {
      ...query,
      id: query.id,
      status_level_change: query.status_level_change?.trim(),
      description: query.description?.trim(),
      is_group: query.is_group,
      created_by_id: query.created_by_id,
      created_at_from: query.created_at_from,
      created_at_to: query.created_at_to,
      selected_course_id: query.selected_course_id,
      selected_level_id: query.selected_level_id,
      creator_name: query.creator_name?.trim(),
    };

    const where = {};

    if (filters.id) {
      where.id = trimmedQuery.id;
    }

    if (filters.status_level_change) {
      where.status_level_change = trimmedQuery.status_level_change;
    }
    if (filters.description) {
      where.description = { [Op.like]: `%${trimmedQuery.description}%` };
    }
    if (filters.is_group !== undefined) {
      where.is_group =
        trimmedQuery.is_group === 'true' || trimmedQuery.is_group === true;
    }
    if (filters.created_by_id) {
      where.created_by_id = trimmedQuery.created_by_id;
    }

    if (filters.created_at_from) {
      where.created_at = where.created_at || {};
      where.created_at[Op.gte] = new Date(trimmedQuery.created_at_from);
    }
    if (filters.created_at_to) {
      where.created_at = where.created_at || {};
      where.created_at[Op.lte] = new Date(trimmedQuery.created_at_to);
    }

    if (filters.selected_course_id) {
      where.selected_course_id = trimmedQuery.selected_course_id;
    }
    if (filters.selected_level_id) {
      where.selected_level_id = trimmedQuery.selected_level_id;
    }

    if (filters.student_id) {
      const studentTransfers = await _studentTransfer.findAll({
        where: { student_id: filters.student_id },
        attributes: ['transfer_data_id'],
        raw: true,
      });
      const transferDataIds = studentTransfers.map((st) => st.transfer_data_id);
      if (!transferDataIds.length) {
        return {
          data: { result: [], totalCount: 0 },
        };
      }
      where.id = { [Op.in]: transferDataIds };
    }

    const includes = [
      {
        model: _course,
        as: 'selected_course',
        attributes: ['id', 'course_name'],
      },
      {
        model: _level,
        as: 'selected_level',
        attributes: ['id', 'full_level'],
      },
      {
        model: _user,
        as: 'created_by',
        attributes: ['id', 'name', 'email'],
        ...(filters.creator_name && {
          where: { name: { [Op.like]: `%${trimmedQuery.creator_name}%` } },
        }),
      },
    ];

    const { count, rows } = await _transferData.findAndCountAll({
      where,
      include: includes,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    return {
      data: {
        result: rows,
        totalCount: count,
      },
    };
  });

  getTransferData = catchServiceAsync(async (id) => {
    if (!id) {
      throw new AppError('Id must be sent', 400);
    }

    const transferData = await _transferData.findOne({
      where: { id },
      include: [
        {
          model: _course,
          as: 'selected_course',
          attributes: ['id', 'course_name'],
        },
        {
          model: _level,
          as: 'selected_level',
          attributes: ['id', 'full_level'],
        },
        {
          model: _user,
          as: 'created_by',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!transferData) {
      throw new AppError('Transfer data not found', 404);
    }

    return transferData;
  });

  getPendingTransferData = catchServiceAsync(async (query = {}) => {
    const { page = 1, limit = 10, ...filters } = query;
    const limitNumber = parseInt(limit, 10);
    const pageNumber = parseInt(page, 10);

    let where = { status_level_change: 'pending' };
    if (filters.created_at_from) {
      where.created_at = where.created_at || {};
      where.created_at[Op.gte] = new Date(filters.created_at_from);
    }
    if (filters.created_at_to) {
      where.created_at = where.created_at || {};
      where.created_at[Op.lte] = new Date(filters.created_at_to);
    }

    const totalCount = await _transferData.count({ where });

    const { rows } = await _transferData.findAndCountAll({
      where,
      include: [
        {
          model: _course,
          as: 'selected_course',
          attributes: ['id', 'course_name'],
        },
        {
          model: _level,
          as: 'selected_level',
          attributes: ['id', 'full_level'],
        },
        { model: _user, as: 'created_by', attributes: ['id', 'name', 'email'] },
      ],
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    if (!rows.length) {
      return {
        data: [],
        totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
      };
    }

    const transferIds = rows.map((td) => td.id);
    const stRecs = await _studentTransfer.findAll({
      where: { transfer_data_id: { [Op.in]: transferIds } },
      include: [
        {
          model: _student,
          as: 'student',
          attributes: ['id', 'cedula', 'phone_number', 'status', 'level_id'],
          include: [
            { model: _user, as: 'user', attributes: ['id', 'name', 'email'] },
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
            { model: _level, as: 'level', attributes: ['id', 'full_level'] },
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

    const byTransfer = stRecs.reduce((acc, rec) => {
      const tdId = rec.transfer_data_id;
      if (!acc[tdId]) acc[tdId] = [];
      acc[tdId].push(rec.toJSON());
      return acc;
    }, {});

    const dataFormatted = rows.map((td) => {
      const t = td.toJSON();
      const sts = byTransfer[t.id] || [];

      const students = sts.map((stRec) => {
        const student = stRec.student;
        const transferData = stRec.transfer_data;

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
          (c) => c.course_id === transferData.selected_course_id
        );
        const levelLabel = student.level?.full_level || null;

        return {
          ...stRec,
          student: {
            id: student.id,
            cedula: student.cedula,
            phone_number: student.phone_number,
            status: student.status,
            level: student.level
              ? { id: student.level.id, name: levelLabel }
              : null,
            user: student.user,
            courses,
          },
          transfer_data: {
            id: transferData.id,
            status_level_change: transferData.status_level_change,
            description: transferData.description,
            is_group: transferData.is_group,
            selected_course: selectedCourse || null,
            selected_level:
              levelLabel && transferData.selected_level_id
                ? { label: levelLabel, value: transferData.selected_level_id }
                : null,
          },
        };
      });

      return {
        transfer_data: {
          id: td.id,
          status_level_change: td.status_level_change,
          description: td.description,
          is_group: td.is_group,
          created_by: td.created_by,
          selected_course: td.selected_course,
          selected_level: td.selected_level,
          created_at: td.created_at,
          updated_at: td.updated_at,
        },
        students,
      };
    });

    return {
      data: dataFormatted,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
    };
  });

  createTransferData = catchServiceAsync(async (body = {}) => {
    let {
      selected_course_id = null,
      selected_level_id = null,
      status_level_change = ALLOWED_STATUS.PENDING,
      description = null,
      is_group = false,
      created_by_id = null,
      student_ids = [],
    } = body;

    if (!selected_course_id && !selected_level_id) {
      throw new AppError(
        'You must provide either "selected_course_id" or "selected_level_id".',
        400
      );
    }
    if (!Object.values(ALLOWED_STATUS).includes(status_level_change)) {
      throw new AppError('Invalid value for "status_level_change".', 400);
    }
    validateParameters({ status_level_change });

    const transaction = await _sequelize.transaction();
    try {
      const newTD = await _transferData.create(
        {
          selected_course_id,
          selected_level_id,
          status_level_change,
          description,
          is_group,
          created_by_id,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction }
      );

      if (Array.isArray(student_ids) && student_ids.length > 0) {
        const stRecords = student_ids.map((student_id) => ({
          student_id,
          transfer_data_id: newTD.id,
          created_at: new Date(),
          updated_at: new Date(),
        }));
        await _studentTransfer.bulkCreate(stRecords, { transaction });
      }

      await transaction.commit();
      return this.getTransferData(newTD.id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  });

  approveTransfer = catchServiceAsync(async (transferDataId) => {
    const transaction = await _sequelize.transaction();
    let transferData;
    let studentTransfers;

    try {
      transferData = await _transferData.findByPk(transferDataId, {
        include: [
          {
            model: _course,
            as: 'selected_course',
            attributes: ['id', 'course_name'],
          },
          {
            model: _level,
            as: 'selected_level',
            attributes: ['id', 'full_level'],
          },
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!transferData) {
        throw new AppError('Transfer data not found', 404);
      }

      if (transferData.status_level_change === ALLOWED_STATUS.REJECTED) {
        throw new AppError('Rejected transfer cannot be approved', 400);
      }

      studentTransfers = await _studentTransfer.findAll({
        where: { transfer_data_id: transferDataId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!studentTransfers.length) {
        throw new AppError('Transfer has no students to process', 400);
      }

      if (
        transferData.status_level_change !== ALLOWED_STATUS.APPROVED &&
        !transferData.selected_course_id &&
        !transferData.selected_level_id
      ) {
        throw new AppError('Transfer target course or level is required', 400);
      }

      if (transferData.status_level_change !== ALLOWED_STATUS.APPROVED) {
        for (const studentTransfer of studentTransfers) {
          const student = await _student.findByPk(studentTransfer.student_id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!student) {
            throw new AppError(
              `Student with ID ${studentTransfer.student_id} not found`,
              404
            );
          }

          if (transferData.selected_level_id) {
            await _student.update(
              { level_id: transferData.selected_level_id },
              { where: { id: student.id }, transaction }
            );
          }

          if (transferData.selected_course_id) {
            await _courseStudent.update(
              { is_retired: true },
              { where: { student_id: student.id, is_retired: false }, transaction }
            );

            const existingActiveEnrollment = await _courseStudent.findOne({
              where: {
                student_id: student.id,
                course_id: transferData.selected_course_id,
                is_retired: false,
              },
              transaction,
            });

            if (!existingActiveEnrollment) {
              await _courseStudent.create(
                {
                  student_id: student.id,
                  course_id: transferData.selected_course_id,
                  enrollment_date: new Date(),
                  is_retired: false,
                },
                { transaction }
              );
            }
          }
        }

        await _transferData.update(
          {
            status_level_change: ALLOWED_STATUS.APPROVED,
            updated_at: new Date(),
          },
          { where: { id: transferDataId }, transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const updatedStudents = await Promise.all(
      studentTransfers.map(async (studentTransfer) => {
        const student = await _student.findByPk(studentTransfer.student_id, {
          include: [
            {
              model: _level,
              as: 'level',
              attributes: ['id', 'full_level'],
            },
            {
              model: _courseStudent,
              as: 'coursesStudent',
              include: [
                {
                  model: _course,
                  as: 'course',
                  attributes: ['course_name', 'course_number'],
                },
              ],
            },
          ],
        });
        return student;
      })
    );

    return {
      data: {
        students: updatedStudents,
        transfer_data: {
          id: transferData.id,
          status_level_change: ALLOWED_STATUS.APPROVED,
          selected_course: transferData.selected_course,
          selected_level: transferData.selected_level,
        },
      },
    };
  });

  rejectTransfer = catchServiceAsync(async (transferDataId) => {
    const transferData = await _transferData.findByPk(transferDataId);

    if (!transferData) {
      throw new AppError('Transfer data not found', 404);
    }

    await _transferData.update(
      { status_level_change: 'rejected' },
      { where: { id: transferDataId } }
    );

    return {
      message: 'Transfer has been rejected successfully.',
      transfer_data: transferData,
    };
  });

  updateTransferData = catchServiceAsync(async (id, data) => {
    if (!id) throw new AppError('Id must be sent', 400);

    const exists = await _transferData.findByPk(id);
    if (!exists) throw new AppError('Transfer data not found', 404);

    await _transferData.update(
      { ...data, updated_at: new Date() },
      { where: { id } }
    );

    return this.getTransferData(id);
  });

  updateTransferStatus = catchServiceAsync(
    async (id, { status_level_change }) => {
      if (!id) throw new AppError('Id must be sent', 400);

      if (!Object.values(ALLOWED_STATUS).includes(status_level_change)) {
        throw new AppError('Invalid status', 400);
      }

      const exists = await _transferData.findByPk(id);
      if (!exists) throw new AppError('Transfer data not found', 404);

      await _transferData.update(
        { status_level_change, updated_at: new Date() },
        { where: { id } }
      );

      return this.getTransferData(id);
    }
  );

  deleteTransferData = catchServiceAsync(async (id) => {
    if (!id) {
      throw new AppError('Id must be sent', 400);
    }

    const transferData = await _transferData.findOne({ where: { id } });
    if (!transferData) {
      throw new AppError('Transfer data not found', 404);
    }

    await _transferData.destroy({ where: { id } });
    return { message: 'Transfer data deleted successfully' };
  });

  getApprovedTransfers = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10 } = query;
    const limitNumber = parseInt(limit, 10);
    const pageNumber = parseInt(page, 10);

    const where = { status_level_change: 'approved' };

    const includes = [
      {
        model: _course,
        as: 'selected_course',
        attributes: ['id', 'course_name'],
      },
      {
        model: _level,
        as: 'selected_level',
        attributes: ['id', 'full_level'],
      },
      {
        model: _user,
        as: 'created_by',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: _studentTransfer,
        as: 'student_transfers',
        include: [
          {
            model: _student,
            as: 'student',
            attributes: ['id', 'cedula', 'status', 'level_id'],
            include: [
              { model: _user, as: 'user', attributes: ['id', 'name', 'email'] },
              { model: _level, as: 'level', attributes: ['id', 'full_level'] },
            ],
          },
        ],
      },
    ];

    const { count, rows } = await _transferData.findAndCountAll({
      where,
      include: includes,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      order: [['updated_at', 'DESC']],
      distinct: true,
    });

    return {
      data: {
        result: rows,
        totalCount: count,
      },
    };
  });
};
