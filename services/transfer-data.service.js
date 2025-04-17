const { Op } = require('sequelize');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters } = require('../utils/utils');
const { ALLOWED_STATUS } = require('../utils/constants');
const catchServiceAsync = require('../utils/catch-service-async');

let _user = null;
let _level = null;
let _course = null;
let _sequelize = null;
let _transferData = null;
let _studentTransfer = null;

module.exports = class TransferDataService extends BaseService {
  constructor({
    TransferData,
    Course,
    Level,
    User,
    Sequelize,
    StudentTransfer,
  }) {
    super(TransferData);
    _transferData = TransferData.TransferData;
    _course = Course.Course;
    _level = Level.Level;
    _user = User.User;
    _sequelize = Sequelize;
    _studentTransfer = StudentTransfer.StudentTransfer;
  }

  getAllTransferData = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10, ...filters } = query;

    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);

    // Procesamos y limpiamos los parámetros de consulta
    const trimmedQuery = {
      ...query,
      status_level_change: query.status_level_change?.trim(),
      description: query.description?.trim(),
      is_group: query.is_group,
      created_by_id: query.created_by_id,
      created_at_from: query.created_at_from,
      created_at_to: query.created_at_to,
      course_name: query.course_name?.trim(),
      level_name: query.level_name?.trim(),
      creator_name: query.creator_name?.trim(),
    };

    // Construimos las condiciones de búsqueda
    let where = {};

    // Filtros directos en transfer_data
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

    // Filtros de fecha
    if (filters.created_at_from) {
      where.created_at = where.created_at || {};
      where.created_at[Op.gte] = new Date(trimmedQuery.created_at_from);
    }

    if (filters.created_at_to) {
      where.created_at = where.created_at || {};
      where.created_at[Op.lte] = new Date(trimmedQuery.created_at_to);
    }

    // Verificamos si hay filtros por student_ids
    let studentIds = [];
    if (query.student_id) {
      const studentTransfers = await _studentTransfer.findAll({
        where: { student_id: query.student_id },
        attributes: ['transfer_data_id'],
        raw: true,
      });

      const transferDataIds = studentTransfers.map((st) => st.transfer_data_id);

      if (transferDataIds.length === 0) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: pageNumber,
        };
      }

      where.id = { [Op.in]: transferDataIds };
    }

    // Configuramos los includes para relaciones
    const includes = [
      {
        model: _course,
        as: 'selected_course',
        attributes: ['id', 'course_name'],
        ...(filters.course_name && {
          where: {
            course_name: { [Op.like]: `%${trimmedQuery.course_name}%` },
          },
        }),
      },
      {
        model: _level,
        as: 'selected_level',
        attributes: ['id', 'full_level'],
        ...(filters.level_name && {
          where: {
            full_level: { [Op.like]: `%${trimmedQuery.level_name}%` },
          },
        }),
      },
      {
        model: _user,
        as: 'created_by',
        attributes: ['id', 'name', 'email'],
        ...(filters.creator_name && {
          where: {
            name: { [Op.like]: `%${trimmedQuery.creator_name}%` },
          },
        }),
      },
    ];

    // Ejecutamos la consulta con todos los filtros
    const { count, rows } = await _transferData.findAndCountAll({
      where,
      include: includes,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      order: [['created_at', 'DESC']],
      distinct: true, // Para contar correctamente cuando hay joins
    });

    return {
      data: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limitNumber),
      currentPage: pageNumber,
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
    const { page = 1, limit = 10 } = query;
    const limitNumber = parseInt(limit, 10);
    const pageNumber = parseInt(page, 10);

    const { count, rows } = await _transferData.findAndCountAll({
      where: {
        status_level_change: 'pending',
      },
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
    return {
      data: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limitNumber),
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

    // Validaciones básicas
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

    // Iniciamos la transacción
    const transaction = await _sequelize.transaction();
    try {
      // 1) Creo el registro en transfer_data
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

      // 2) Si vienen student_ids, creamos las asociaciones en bulk
      if (Array.isArray(student_ids) && student_ids.length > 0) {
        const stRecords = student_ids.map((student_id) => ({
          student_id,
          transfer_data_id: newTD.id,
          created_at: new Date(),
          updated_at: new Date(),
        }));
        await _studentTransfer.bulkCreate(stRecords, { transaction });
      }

      // 3) Commit y retorno
      await transaction.commit();
      return this.getTransferData(newTD.id);
    } catch (err) {
      // Rollback en caso de error
      await transaction.rollback();
      throw err;
    }
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
};
