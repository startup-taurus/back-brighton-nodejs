const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');
const { validateParameters } = require('../utils/utils');

let _studentTransferData = null;
let _student = null;
let _courseStudent = null;

module.exports = class StudentTransferDataService extends BaseService {
  constructor({ StudentTransferData, Student, CourseStudent }) {
    super(StudentTransferData.StudentTransferData);
    _studentTransferData = StudentTransferData.StudentTransferData;
    _student = Student.Student;
    _courseStudent = CourseStudent.CourseStudent;
  }

  // Método para crear una solicitud de transferencia pendiente
  createTransferRequest = catchServiceAsync(
    async (studentId, courseId, levelId) => {
      // Verificar que al menos uno de los parámetros esté presente
      if (!courseId && !levelId) {
        throw new AppError(
          'Please provide either a course or a level to transfer students.',
          400
        );
      }

      // Verificar si el estudiante existe
      const student = await _student.findByPk(studentId);
      if (!student) {
        throw new AppError('Student not found', 404);
      }

      // Actualizar el estado del estudiante a 'pending'
      await _student.update(
        { status_level_change: 'pending' },
        { where: { id: studentId } }
      );

      // Crear o actualizar el registro de transferencia
      const existingTransfer = await _studentTransferData.findOne({
        where: { student_id: studentId, status_level_change: 'pending' },
      });

      if (existingTransfer) {
        // Actualizar el registro existente
        await existingTransfer.update({
          selected_course_id: courseId || existingTransfer.selected_course_id,
          selected_level_id: levelId || existingTransfer.selected_level_id,
          updated_at: new Date(),
        });
        return { data: existingTransfer };
      } else {
        // Crear un nuevo registro
        const transferData = await _studentTransferData.create({
          student_id: studentId,
          selected_course_id: courseId || null,
          selected_level_id: levelId || null,
          status_level_change: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
        });
        return { data: transferData };
      }
    }
  );

  // Método para obtener todas las solicitudes de transferencia pendientes
  getPendingTransfers = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10 } = query;

    const limitNumber = parseInt(limit);
    const pageNumber = parseInt(page);

    const transfers = await _studentTransferData.findAndCountAll({
      where: { status_level_change: 'pending' },
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      order: [['created_at', 'DESC']],
    });

    return {
      data: {
        result: transfers.rows,
        totalCount: transfers.count,
      },
    };
  });

  // Método para obtener las solicitudes de transferencia de un estudiante específico
  getStudentTransfers = catchServiceAsync(async (studentId) => {
    const transfers = await _studentTransferData.findAll({
      where: { student_id: studentId },
      order: [['created_at', 'DESC']],
    });

    return { data: transfers };
  });

  // Método para aprobar una solicitud de transferencia
  approveTransfer = catchServiceAsync(async (transferId) => {
    const transfer = await _studentTransferData.findByPk(transferId);

    if (!transfer) {
      throw new AppError('Transfer request not found', 404);
    }

    if (transfer.status_level_change !== 'pending') {
      throw new AppError('Only pending transfers can be approved', 400);
    }

    // Actualizar el estado de la transferencia a 'approved'
    await transfer.update({
      status_level_change: 'approved',
      updated_at: new Date(),
    });

    // Actualizar el estado del estudiante
    await _student.update(
      { status_level_change: 'approved' },
      { where: { id: transfer.student_id } }
    );

    // Ejecutar la transferencia real utilizando los datos almacenados
    try {
      const studentIds = [transfer.student_id];
      const courseId = transfer.selected_course_id;
      const levelId = transfer.selected_level_id;

      const promises = [];

      // Si hay un nuevo curso, asignamos el curso al estudiante
      if (courseId) {
        promises.push(
          studentIds.map((studentId) => {
            return _courseStudent.create({
              student_id: studentId,
              course_id: courseId,
              enrollment_date: new Date(),
            });
          })
        );
      }

      // Si hay un nuevo nivel, actualizamos el nivel del estudiante
      if (levelId) {
        promises.push(
          studentIds.map((studentId) => {
            return _student.update(
              {
                level_id: levelId,
              },
              { where: { id: studentId } }
            );
          })
        );
      }

      // Ejecutamos las promesas de forma paralela
      await Promise.all(promises.flat());
    } catch (error) {
      console.error('Error executing transfer after approval:', error);
      throw new AppError('Error while executing transfer after approval.', 500);
    }

    return { data: transfer };
  });

  // Método para rechazar una solicitud de transferencia
  rejectTransfer = catchServiceAsync(async (transferId) => {
    const transfer = await _studentTransferData.findByPk(transferId);

    if (!transfer) {
      throw new AppError('Transfer request not found', 404);
    }

    if (transfer.status_level_change !== 'pending') {
      throw new AppError('Only pending transfers can be rejected', 400);
    }

    // Actualizar el estado de la transferencia a 'n/a'
    await transfer.update({
      status_level_change: 'n/a',
      updated_at: new Date(),
    });

    // Actualizar el estado del estudiante
    await _student.update(
      { status_level_change: 'n/a' },
      { where: { id: transfer.student_id } }
    );

    return { data: transfer };
  });
};
