let _student = null;
let _course = null;
let _courseStudent = null;
let _professor = null;
let _attendance = null;
let _grades = null;
let _user = null;
module.exports = class AuditModel {
  constructor({
    User,
    Student,
    Course,
    CourseStudent,
    Professor,
    Attendance,
    Grades,
  }) {
    _student = Student.Student;
    _course = Course.Course;
    _courseStudent = CourseStudent.CourseStudent;
    _professor = Professor.Professor;
    _attendance = Attendance.Attendance;
    _grades = Grades.Grades;
    _user = User.User;
    this.defineModel();
  }

  defineModel() {
    // Relación entre curso y profesor
    _course.belongsTo(_professor, {
      foreignKey: "professor_id",
      as: "professor",
    });

    _professor.hasMany(_course, {
      foreignKey: "professor_id",
      as: "courses",
    });

    _professor.belongsTo(_user, {
      foreignKey: "user_id",
      as: "user",
    });

    // Relación de muchos a muchos entre cursos y estudiantes a través de course_student
    _course.belongsToMany(_student, {
      through: _courseStudent,
      foreignKey: "course_id",
      as: "students",
    });

    _student.belongsToMany(_course, {
      through: _courseStudent,
      foreignKey: "student_id",
      as: "courses",
    });

    _student.belongsTo(_user, {
      foreignKey: "user_id",
      as: "user",
    });

    // Relación de uno a muchos entre curso y asistencia
    _attendance.belongsTo(_course, {
      foreignKey: "course_id",
    });
    _course.hasMany(_attendance, {
      foreignKey: "course_id",
    });

    // Relación de uno a muchos entre estudiante y asistencia
    _attendance.belongsTo(_student, {
      foreignKey: "student_id",
    });
    _student.hasMany(_attendance, {
      foreignKey: "student_id",
    });

    // Relación de uno a muchos entre curso y notas (grades)
    _grades.belongsTo(_course, {
      foreignKey: "course_id",
    });
    _course.hasMany(_grades, {
      foreignKey: "course_id",
    });

    // Relación de uno a muchos entre estudiante y notas (grades)
    _grades.belongsTo(_student, {
      foreignKey: "student_id",
    });
    _student.hasMany(_grades, {
      foreignKey: "student_id",
    });
  }
};
