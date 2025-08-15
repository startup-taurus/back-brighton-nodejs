const BaseService = require('./base.service');
const catchServiceAsync = require('../utils/catch-service-async');
const { validateParameters } = require('../utils/utils');

let _user = null;
let _course = null;
let _student = null;
let _privateClassHours = null;
let _courseStudent = null;

module.exports = class PrivateClassHoursService extends BaseService {
  constructor({
    PrivateClassHours,
    User,
    Course,
    Student,
    CourseStudent,
  }) {
    super(PrivateClassHours);
    _user = User.User;
    _course = Course.Course;
    _student = Student.Student;
    _privateClassHours = PrivateClassHours.PrivateClassHours;
    _courseStudent = CourseStudent.CourseStudent;
  }

  getPrivateClassesByCourse = catchServiceAsync(async (courseId) => {
    const course = await _course.findByPk(courseId, {
      attributes: ['course_type']
    });

    if (!course) {
      throw new Error('Curso no encontrado');
    }

    if (course.course_type !== 'private' && course.course_type !== 'private - online') {
      throw new Error('Solo se pueden crear reportes para clases privadas');

    }

    const courseStudent = await _courseStudent.findOne({
      where: { course_id: courseId },
      attributes: ['student_id']
    });

    if (!courseStudent) {
      return { data: [] };
    }

    const privateClasses = await _privateClassHours.findAll({
      where: { 
        student_id: courseStudent.student_id,
        course_id: courseId
      },
      include: [
        {
          model: _student,
          as: '_student',
          attributes: ['id'],
          include: [
            {
              model: _user,
              as: 'user',  
              attributes: ['name']
            }
          ]
        }
      ],
      order: [['lesson_date', 'DESC']]
    });

    return { data: privateClasses };
  });

  getPrivateClassesByStudent = catchServiceAsync(async (studentId) => {
    const privateClasses = await _privateClassHours.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: _course,
          as: '_course',
          attributes: ['id', 'course_name', 'course_type']
        }
      ],
      order: [['lesson_date', 'DESC']]
    });

    return { data: privateClasses };
  });

  createPrivateClass = catchServiceAsync(async (body) => {
    const { 
      student_id, 
      course_id, 
      lesson_date, 
      hours, 
      topic, 
      lesson_status
    } = body;

    validateParameters({
      student_id,
      course_id,
      lesson_date
    });

    const course = await _course.findByPk(course_id, {
      attributes: ['course_type']
    });

    if (!course || course.course_type !== 'private' && course.course_type !== 'private - online') {

      throw new Error('Solo se pueden crear clases para cursos privados');
    }

    const courseStudent = await _courseStudent.findOne({
      where: { 
        course_id: course_id,
        student_id: student_id
      }
    });

    if (!courseStudent) {
      throw new Error('El estudiante no está asociado a este curso');
    }

    const privateClass = await _privateClassHours.create({
      student_id,
      course_id,
      lesson_date,
      hours: hours || 1.0,
      topic: topic || '',
      lesson_status: lesson_status || 'PENDING'
    });

    return { data: privateClass };
  });

  updatePrivateClass = catchServiceAsync(async (classId, updateData, professorId = null) => {
    const privateClass = await _privateClassHours.findByPk(classId);
  
    if (!privateClass) {
      throw new Error('Clase privada no encontrada');
    }
  
    if (professorId) {
      const course = await _course.findByPk(privateClass.course_id, {
        attributes: ['professor_id']
      });
  
      if (!course || course.professor_id !== professorId) {
        throw new Error('Solo el profesor asignado puede actualizar esta clase');
      }
    }
  
    const updatedClass = await privateClass.update({
      lesson_date: updateData.lesson_date || privateClass.lesson_date,
      hours: updateData.hours !== undefined ? updateData.hours : privateClass.hours,
      topic: updateData.topic !== undefined ? updateData.topic : privateClass.topic,
      lesson_status: updateData.lesson_status || privateClass.lesson_status
    });
  
    return { data: updatedClass };
  });

  deletePrivateClass = catchServiceAsync(async (classId, professorId = null) => {
    const privateClass = await _privateClassHours.findByPk(classId);

    if (!privateClass) {
      throw new Error('Clase privada no encontrada');
    }

    if (professorId) {
      const course = await _course.findByPk(privateClass.course_id, {
        attributes: ['professor_id']
      });

      if (!course || course.professor_id !== professorId) {
        throw new Error('Solo el profesor asignado puede eliminar esta clase');
      }
    }

    await privateClass.destroy();
    return { data: { message: 'Clase privada eliminada exitosamente' } };
  });

  createMultiplePrivateClasses = catchServiceAsync(async (courseId, entries, professorId = null) => {
    const course = await _course.findByPk(courseId, {
      attributes: ['course_type', 'professor_id']
    });

    if (!course) {
      throw new Error('Curso no encontrado');
    }

    if (course.course_type !== 'private' && course.course_type !== 'private - online') {

      throw new Error('Solo se pueden crear reportes para clases privadas');
    }

    if (professorId && course.professor_id !== professorId) {
      throw new Error('Solo el profesor asignado puede crear reportes para este curso');
    }

    const courseStudent = await _courseStudent.findOne({
      where: { course_id: courseId },
      attributes: ['student_id']
    });

    if (!courseStudent) {
      throw new Error('No se encontró estudiante asociado al curso privado');
    }

    const privateClassEntries = entries.map(entry => ({
      student_id: courseStudent.student_id,
      course_id: courseId,
      lesson_date: entry.date || new Date().toISOString().split('T')[0],
      hours: entry.hours || 1.0,
      topic: entry.topic || '',
      lesson_status: entry.status || 'DONE'
    }));

    const createdEntries = await _privateClassHours.bulkCreate(privateClassEntries);
    return { data: createdEntries };
  });

  getPrivateClassStats = catchServiceAsync(async (courseId) => {
    const stats = await _privateClassHours.findAll({
      where: { course_id: courseId }
    });

    return { data: stats ?? [] };
  });
};