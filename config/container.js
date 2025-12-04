//Configurar nuestro contenedor de injección de depencia
const { createContainer, asClass, asValue, asFunction } = require('awilix');
const { Sequelize } = require('sequelize');
//Config
const config = require('.');

//Routes
const Routes = require('../routes');

//Services
const {
  UserService,
  StudentService,
  ProfessorService,
  PaymentService,
  CourseService,
  LevelService,
  AttendanceService,
  HolidaysService,
  CancelledLessonService,
  SyllabusService,
  CourseScheduleService,
  CourseGradingService,
  StudentGradesService,
  RegisteredStudentService,
  TransferDataService,
  StudentTransferService,
  PrivateClassHoursService,
  PermissionsService,
  RoleService,

} = require('../services');

//Controllers
const {
  UserController,
  StudentController,
  ProfessorController,
  PaymentController,
  CourseController,
  LevelController,
  AttendanceController,
  HolidaysController,
  CancelledLessonController,
  SyllabusController,
  CourseScheduleController,
  CourseGradingController,
  StudentGradesController,
  RegisteredStudentController,
  TransferDataController,
  StudentTransferController,
  PrivateClassHoursController,
  PermissionsController,
  RoleController,

} = require('../controllers');

//Startup
const { Database, Server } = require('../startup');

//Routes
const {
  UserRoutes,
  StudentRoutes,
  ProfessorRoutes,
  PaymentRoutes,
  CourseRoutes,
  LevelRoutes,
  AttendanceRoutes,
  HolidaysRoutes,
  CancelledLessonRoutes,
  SyllabusRoutes,
  CourseScheduleRoutes,
  StudentGradesRoutes,
  RegisteredStudentRoutes,
  TransferDataRoutes,
  StudentTransferRoutes,
  PrivateClassHoursRoutes, 
  PermissionsRoutes,
  RoleRoutes,

} = require('../routes/api/index');

//Models
const {
  Association,
  User,
  Student,
  Professor,
  Payment,
  Course,
  Level,
  CourseStudent,
  Attendance,
  Grades,
  Holidays,
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
  RegisteredStudent,
  StudentTransfer,
  TransferData,
  PrivateClassHours, 
  RolePermission,
  Permission,
  Role
} = require('../models');

const protect = require('../middleware/authMiddleware');

const {
  TeacherMiddleware,
  ValidateCourseMiddleware,
} = require('../middleware');

const AuthUtils = require('../utils/auth');
const container = createContainer();
container
  .register({
    //Configuración principal
    router: asFunction(Routes).singleton(),
    config: asValue(config),
    AuthUtils: asClass(AuthUtils).singleton(),
    Database: asClass(Database).singleton(),
    Sequelize: asValue(new Sequelize(config.DB)),
    Server: asClass(Server).singleton(),
  })
  .register({
    //Configuración de los servicios
    UserService: asClass(UserService).singleton(),
    StudentService: asClass(StudentService).singleton(),
    ProfessorService: asClass(ProfessorService).singleton(),
    PaymentService: asClass(PaymentService).singleton(),
    CourseService: asClass(CourseService).singleton(),
    AttendanceService: asClass(AttendanceService).singleton(),
    HolidaysService: asClass(HolidaysService).singleton(),
    CancelledLessonService: asClass(CancelledLessonService).singleton(),
    SyllabusService: asClass(SyllabusService).singleton(),
    CourseScheduleService: asClass(CourseScheduleService).singleton(),
    CourseGradingService: asClass(CourseGradingService).singleton(),
    StudentGradesService: asClass(StudentGradesService).singleton(),
    RegisteredStudentService: asClass(RegisteredStudentService).singleton(),
    LevelService: asClass(LevelService).singleton(),
    TransferDataService: asClass(TransferDataService).singleton(),
    StudentTransferService: asClass(StudentTransferService).singleton(),
    PrivateClassHoursService: asClass(PrivateClassHoursService).singleton(),
    PermissionsService: asClass(PermissionsService).singleton(),
    RoleService: asClass(RoleService).singleton(),

  })

  .register({
    //Configuración de los controladores
    UserController: asClass(UserController.bind(UserController)).singleton(),
    StudentController: asClass(
      StudentController.bind(StudentController)
    ).singleton(),
    ProfessorController: asClass(
      ProfessorController.bind(ProfessorController)
    ).singleton(),
    PaymentController: asClass(
      PaymentController.bind(PaymentController)
    ).singleton(),
    CourseController: asClass(
      CourseController.bind(CourseController)
    ).singleton(),
    AttendanceController: asClass(
      AttendanceController.bind(AttendanceController)
    ).singleton(),
    HolidaysController: asClass(
      HolidaysController.bind(HolidaysController)
    ).singleton(),
    CancelledLessonController: asClass(CancelledLessonController).singleton(),
    SyllabusController: asClass(
      SyllabusController.bind(SyllabusController)
    ).singleton(),
    CourseScheduleController: asClass(CourseScheduleController).singleton(),
    CourseGradingController: asClass(CourseGradingController).singleton(),
    StudentGradesController: asClass(StudentGradesController).singleton(),
    RegisteredStudentController: asClass(
      RegisteredStudentController
    ).singleton(),
    LevelController: asClass(LevelController).singleton(),
    TransferDataController: asClass(TransferDataController).singleton(),
    StudentTransferController: asClass(StudentTransferController).singleton(),
    PrivateClassHoursController: asClass(PrivateClassHoursController).singleton(),
    PermissionsController: asClass(PermissionsController).singleton(),
    RoleController: asClass(RoleController).singleton(),

  })
  .register({
    //Configuración de rutas
    UserRoutes: asFunction(UserRoutes).singleton(),
    StudentRoutes: asFunction(StudentRoutes).singleton(),
    ProfessorRoutes: asFunction(ProfessorRoutes).singleton(),
    PaymentRoutes: asFunction(PaymentRoutes).singleton(),
    CourseRoutes: asFunction(CourseRoutes).singleton(),
    AttendanceRoutes: asFunction(AttendanceRoutes).singleton(),
    HolidaysRoutes: asFunction(HolidaysRoutes).singleton(),
    CancelledLessonRoutes: asFunction(CancelledLessonRoutes).singleton(),
    SyllabusRoutes: asFunction(SyllabusRoutes).singleton(),
    CourseScheduleRoutes: asFunction(CourseScheduleRoutes).singleton(),
    StudentGradesRoutes: asFunction(StudentGradesRoutes).singleton(),
    RegisteredStudentRoutes: asFunction(RegisteredStudentRoutes).singleton(),
    LevelRoutes: asFunction(LevelRoutes).singleton(),
    TransferDataRoutes: asFunction(TransferDataRoutes).singleton(),
    StudentTransferRoutes: asFunction(StudentTransferRoutes).singleton(),
    PrivateClassHoursRoutes: asFunction(PrivateClassHoursRoutes).singleton(),
    PermissionsRoutes: asFunction(PermissionsRoutes).singleton(),
    RoleRoutes: asFunction(RoleRoutes).singleton(),

  })
  .register({
    //Configuración de las asociaciones
    Association: asClass(Association).singleton(),
  })
  .register({
    //Configuración de modelos
    User: asClass(User).singleton(),
    Course: asClass(Course).singleton(),
    Student: asClass(Student).singleton(),
    Professor: asClass(Professor).singleton(),
    Payment: asClass(Payment).singleton(),
    Course: asClass(Course).singleton(),
    CourseStudent: asClass(CourseStudent).singleton(),
    Attendance: asClass(Attendance).singleton(),
    Grades: asClass(Grades).singleton(),
    Holidays: asClass(Holidays).singleton(),
    CancelledLesson: asClass(CancelledLesson).singleton(),
    Syllabus: asClass(Syllabus).singleton(),
    SyllabusItems: asClass(SyllabusItems).singleton(),
    GradePercentages: asClass(GradePercentages).singleton(),
    CourseSchedule: asClass(CourseSchedule).singleton(),
    CourseGrading: asClass(CourseGrading).singleton(),
    GradingItem: asClass(GradingItem).singleton(),
    GradingCategory: asClass(GradingCategory).singleton(),
    StudentGrades: asClass(StudentGrades).singleton(),
    Percentages: asClass(Percentages).singleton(),
    RegisteredStudent: asClass(RegisteredStudent).singleton(),
    Level: asClass(Level).singleton(),
    StudentTransfer: asClass(StudentTransfer).singleton(),
    TransferData: asClass(TransferData).singleton(),
    PrivateClassHours: asClass(PrivateClassHours).singleton(), 
    RolePermission: asClass(RolePermission).singleton(),
    Permission: asClass(Permission).singleton(),
    Role: asClass(Role).singleton(),
  })
  .register({
    //middlewares
    AuthMiddleware: asFunction(protect).singleton(),
    TeacherMiddleware: asValue(TeacherMiddleware),
    ValidateCourseMiddleware: asFunction(ValidateCourseMiddleware).singleton(),
  });

module.exports = container;
