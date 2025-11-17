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
let _courseSchedule = null;
let _gradingCategory = null;
let _courseGrading = null;
let _gradingItem = null;
let _studentGrades = null;
let _percentages = null;
let _level = null;
let _registeredStudent = null;
let _studentTransfer = null;
let _transferData = null;
let _privateClassHours = null;
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
    CourseSchedule,
    CourseGrading,
    GradingItem,
    GradingCategory,
    StudentGrades,
    Percentages,
    Level,
    RegisteredStudent,
    StudentTransfer,
    TransferData,
    PrivateClassHours,

  }) {
    _student = Student.Student;
    _registeredStudent = RegisteredStudent.RegisteredStudent;
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
    _courseSchedule = CourseSchedule.CourseSchedule;
    _gradingCategory = GradingCategory.GradingCategory;
    _courseGrading = CourseGrading.CourseGrading;
    _gradingItem = GradingItem.GradingItem;
    _studentGrades = StudentGrades.StudentGrades;
    _percentages = Percentages.Percentages;
    _level = Level.Level;
    _studentTransfer = StudentTransfer.StudentTransfer;
    _transferData = TransferData.TransferData;
    _privateClassHours = PrivateClassHours.PrivateClassHours;

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

    // Relación entre estudiante y nivel
    _student.belongsTo(_level, {
      foreignKey: 'level_id',
      as: 'level',
    });

    _level.hasMany(_student, {
      foreignKey: 'level_id',
      as: 'students',
    });

    // Relación muchos a muchos entre estudiante y datos de transferencia a través de student_transfer
    _student.belongsToMany(_transferData, {
      through: _studentTransfer,
      foreignKey: 'student_id',
      otherKey: 'transfer_data_id',
      as: 'transfer_data',
    });

    _transferData.belongsToMany(_student, {
      through: _studentTransfer,
      foreignKey: 'transfer_data_id',
      otherKey: 'student_id',
      as: 'students',
    });

    // Relaciones de StudentTransfer con Student y TransferData
    _studentTransfer.belongsTo(_student, {
      foreignKey: 'student_id',
      as: 'student',
    });

    _studentTransfer.belongsTo(_transferData, {
      foreignKey: 'transfer_data_id',
      as: 'transfer_data',
    });

    // Relaciones de TransferData con Course, Level y User
    _transferData.belongsTo(_course, {
      foreignKey: 'selected_course_id',
      as: 'selected_course',
    });

    _transferData.belongsTo(_level, {
      foreignKey: 'selected_level_id',
      as: 'selected_level',
    });

    _transferData.belongsTo(_user, {
      foreignKey: 'created_by_id',
      as: 'created_by',
    });

    // Relación de TransferData con StudentTransfer
    _transferData.hasMany(_studentTransfer, {
      foreignKey: 'transfer_data_id',
      as: 'student_transfers',
    });

    _registeredStudent.belongsTo(_level, {
      foreignKey: 'level_id',
      as: 'level',
    });

    _level.hasMany(_registeredStudent, {
      foreignKey: 'level_id',
      as: 'registered_students',
    });

    _courseStudent.belongsTo(_course, {
      foreignKey: 'course_id',
      as: 'course',
    });

    _courseStudent.belongsTo(_student, {
      foreignKey: 'student_id',
    });
    _student.hasMany(_courseStudent, {
      foreignKey: 'student_id',
      as: 'coursesStudent',
    });

    _attendance.belongsTo(_courseSchedule, {
      foreignKey: 'course_schedule_id',
      as: 'course_schedule'
    });
    _courseSchedule.hasMany(_attendance, {
      foreignKey: 'course_schedule_id',
    });

    _courseSchedule.belongsTo(_course, {
      foreignKey: 'course_id',
      as: 'course'
    });
    _course.hasMany(_courseSchedule, {
      foreignKey: 'course_id',
      as: 'course_schedule',
    });
    
    // Additional association with plural alias for professor service
    _course.hasMany(_courseSchedule, {
      foreignKey: 'course_id',
      as: 'course_schedules',
    });

    // Relación de uno a muchos entre estudiante y asistencia
    _attendance.belongsTo(_student, {
      foreignKey: 'student_id',
      as: 'student'
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
    _syllabus.belongsTo(_level, {
      foreignKey: 'level_id',
      as: 'level',
    });

    _level.hasMany(_syllabus, {
      foreignKey: 'level_id',
      as: 'syllabus',
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

    _syllabusItems.hasMany(_courseSchedule, {
      foreignKey: 'syllabus_item_id',
      as: 'course_schedule',
    });
    _courseSchedule.belongsTo(_syllabusItems, {
      foreignKey: 'syllabus_item_id',
      as: 'syllabusItem',
    });

    _syllabus.hasMany(_gradingItem, {
      foreignKey: 'syllabus_id',
      as: 'grading_items',
    });
    _gradingItem.belongsTo(_syllabus, {
      foreignKey: 'syllabus_id',
      as: 'syllabus',
    });

    // GradingCategory -> GradingItem
    _gradingCategory.hasMany(_gradingItem, {
      foreignKey: 'category_id',
      as: 'items',
    });
    _gradingItem.belongsTo(_gradingCategory, {
      foreignKey: 'category_id',
      as: 'category',
    });

    // GradingItem -> CourseGrading
    _gradingItem.hasMany(_courseGrading, {
      foreignKey: 'grading_item_id',
      as: 'course_grades',
    });
    _courseGrading.belongsTo(_gradingItem, {
      foreignKey: 'grading_item_id',
      as: 'grading_item',
    });

    // Course -> CourseGrading
    _course.hasMany(_courseGrading, {
      foreignKey: 'course_id',
      as: 'grading_items',
    });
    _courseGrading.belongsTo(_course, {
      foreignKey: 'course_id',
      as: 'course',
    });

    // StudentGrades -> GradingItem
    _studentGrades.belongsTo(_gradingItem, {
      foreignKey: 'grading_item_id',
      as: 'grading_item', // This alias matches the service query
    });

    // GradingItem -> StudentGrades
    _gradingItem.hasMany(_studentGrades, {
      foreignKey: 'grading_item_id',
      as: 'studentGradeEntries', // Using a distinct alias for clarity
    });

    // Student -> StudentGrades
    _student.hasMany(_studentGrades, {
      foreignKey: 'student_id',
      as: 'student_grades_overall',
    });
    _studentGrades.belongsTo(_student, {
      foreignKey: 'student_id',
      as: 'student',
    });

    // SyllabusModel (o donde defines tu modelo syllabus)
    _syllabus.hasMany(_percentages, {
      foreignKey: 'syllabus_id',
      as: 'percentages_syllabus',
    });

    // PercentagesModel
    _percentages.belongsTo(_syllabus, {
      foreignKey: 'syllabus_id',
      as: 'syllabus',
    });
    _course.hasMany(_privateClassHours, {
      foreignKey: 'course_id',
      as: 'private_classes',
    });

    _privateClassHours.belongsTo(_course, {
      foreignKey: 'course_id',
      as: 'private_classes',
    });
    
    _student.hasMany(_privateClassHours, {
      foreignKey: 'student_id',
      as: '_student',

    });

    _privateClassHours.belongsTo(_student, {
      foreignKey: 'student_id',
      as: '_student',
    });
  }
};
