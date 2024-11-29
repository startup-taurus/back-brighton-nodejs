let _student = null;
let _course = null;
let _courseStudent = null;
let _professor = null;
let _attendance = null;
let _grades = null;
let _user = null;
let _payment = null;
let _cancelledLesson = null;
let _syllabus = null;
let _syllabusItems = null;
let _gradePercentages = null;
module.exports = class AuditModel {
  constructor({
    User,
    Student,
    Course,
    CourseStudent,
    Professor,
    Attendance,
    Grades,
    Payment,
    CancelledLesson,
    Syllabus,
    SyllabusItems,
    GradePercentages,
  }) {
    _student = Student.Student;
    _course = Course.Course;
    _courseStudent = CourseStudent.CourseStudent;
    _professor = Professor.Professor;
    _attendance = Attendance.Attendance;
    _grades = Grades.Grades;
    _user = User.User;
    _payment = Payment.Payment;
    _cancelledLesson = CancelledLesson.CancelledLesson;
    _syllabus = Syllabus.Syllabus;
    _syllabusItems = SyllabusItems.SyllabusItems;
    _gradePercentages = GradePercentages.GradePercentages;
    this.defineModel();
  }

  defineModel() {
    // Relación entre curso y profesor
    _course.belongsTo(_professor, {
      foreignKey: 'professor_id',
      as: 'professor',
    });

    _professor.hasMany(_course, {
      foreignKey: 'professor_id',
      as: 'courses',
    });

    _professor.belongsTo(_user, {
      foreignKey: 'user_id',
      as: 'user',
    });

    // Relación de muchos a muchos entre cursos y estudiantes a través de course_student
    _course.belongsToMany(_student, {
      through: _courseStudent,
      foreignKey: 'course_id',
      as: 'students',
    });

    _student.belongsToMany(_course, {
      through: _courseStudent,
      foreignKey: 'student_id',
      as: 'courses',
    });

    _student.belongsTo(_user, {
      foreignKey: 'user_id',
      as: 'user',
    });

    // Relación de uno a muchos entre curso y asistencia
    _attendance.belongsTo(_course, {
      foreignKey: 'course_id',
    });
    _course.hasMany(_attendance, {
      foreignKey: 'course_id',
    });

    // Relación de uno a muchos entre estudiante y asistencia
    _attendance.belongsTo(_student, {
      foreignKey: 'student_id',
    });
    _student.hasMany(_attendance, {
      foreignKey: 'student_id',
    });

    // Relación de uno a muchos entre curso y notas (grades)
    _grades.belongsTo(_course, {
      foreignKey: 'course_id',
    });
    _course.hasMany(_grades, {
      foreignKey: 'course_id',
    });

    // Relación de uno a muchos entre estudiante y notas (grades)
    _grades.belongsTo(_student, {
      foreignKey: 'student_id',
    });
    _student.hasMany(_grades, {
      foreignKey: 'student_id',
    });

    // Relación de uno a uno entre estudiante y pago
    _student.hasMany(_payment, {
      foreignKey: 'student_id',
      as: 'payment',
    });
    _payment.belongsTo(_student, {
      foreignKey: 'student_id',
      as: 'student',
    });

    // Relación de muchos a muchos entre estudiantes y cursos
    _student.belongsToMany(_course, {
      through: {
        model: 'course_student',
        timestamps: false,
      },
      foreignKey: 'student_id',
      otherKey: 'course_id',
      as: 'course',
    });

    _course.belongsToMany(_student, {
      through: {
        model: 'course_student',
        timestamps: false,
      },
      foreignKey: 'course_id',
      otherKey: 'student_id',
      as: 'student',
    });

    // Relación de muchos a muchos entre cancelledLesson y cursos
    _course.hasMany(_cancelledLesson, {
      foreignKey: 'course_id',
      as: 'course',
    });
    _cancelledLesson.belongsTo(_course, {
      foreignKey: 'course_id',
      as: 'course',
    });

    _syllabus.hasMany(_syllabusItems, {
      foreignKey: 'syllabus_id',
      as: 'items',
    });
    _syllabusItems.belongsTo(_syllabus, {
      foreignKey: 'syllabus_id',
      as: 'syllabus',
    });

    _syllabus.hasOne(_gradePercentages, {
      foreignKey: 'syllabus_id',
      as: 'percentages',
    });
    _gradePercentages.belongsTo(_syllabus, {
      foreignKey: 'syllabus_id',
      as: 'syllabus',
    });

    _syllabus.hasMany(_course, {
      foreignKey: 'syllabus_id',
      as: 'courses',
    });
    _course.belongsTo(_syllabus, {
      foreignKey: 'syllabus_id',
      as: 'syllabus',
    });
  }
};
