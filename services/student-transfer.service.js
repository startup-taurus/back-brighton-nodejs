// services/studentTransfer.service.js

const { Op } = require('sequelize');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters } = require('../utils/utils');
const catchServiceAsync = require('../utils/catch-service-async');
const { ALLOWED_STATUS } = require('../utils/constants');

let _studentTransfer, _student, _user, _transferData;

module.exports = class StudentTransferService extends BaseService {
  constructor({ StudentTransfer, Student, User, TransferData }) {
    super(StudentTransfer);
    _studentTransfer = StudentTransfer.StudentTransfer;
    _student = Student.Student;
    _user = User.User;
    _transferData = TransferData.TransferData;
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
    });

    if (!st) throw new AppError('Student transfer not found', 404);
    return st;
  });

  /**
   * Obtener todas las asociaciones dentro de un mismo transfer_data_id
   */
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
            attributes: ['id', 'cedula', 'phone_number', 'status'],
            include: [
              {
                model: _user,
                as: 'user',
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
        ],
      });

      return sts;
    }
  );

  /**
   * Crear una nueva asociación StudentTransfer
   * (cuerpo por defecto {} para evitar errores de destructuring)
   */
  createStudentTransfer = catchServiceAsync(async (body = {}) => {
    const { student_id, transfer_data_id } = body;

    // Validar parámetros requeridos
    validateParameters({ student_id, transfer_data_id });

    // 1) Existe el estudiante?
    const student = await _student.findByPk(student_id);
    if (!student) throw new AppError('Student not found', 404);

    // 2) Existe el TransferData?
    const td = await _transferData.findByPk(transfer_data_id);
    if (!td) throw new AppError('Transfer data not found', 404);

    // 3) No esté ya asociado
    const exists = await _studentTransfer.findOne({
      where: { student_id, transfer_data_id },
    });
    if (exists) throw new AppError('Student is already in this transfer', 400);

    // 4) Crear la asociación
    const newST = await _studentTransfer.create({
      student_id,
      transfer_data_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Obtener detalle completo y devolver en { data: … }
    const result = await this.getStudentTransfer(newST.id);
    return { data: result };
  });

  /**
   * Eliminar una asociación por su ID
   */
  deleteStudentTransfer = catchServiceAsync(async (id) => {
    if (!id) throw new AppError('Id must be sent', 400);

    const st = await _studentTransfer.findByPk(id);
    if (!st) throw new AppError('Student transfer not found', 404);

    await _studentTransfer.destroy({ where: { id } });
    return { message: 'Student transfer deleted successfully' };
  });

  /**
   * Quitar un student de un transfer_data concreto
   */
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
