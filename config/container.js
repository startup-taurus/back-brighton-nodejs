//Configurar nuestro contenedor de injección de depencia
const { createContainer, asClass, asValue, asFunction } = require("awilix");
const { Sequelize } = require("sequelize");
//Config
const config = require(".");

//Routes
const Routes = require("../routes");

//Services
const {
  UserService,
  StudentService,
  ProfessorService,
  PaymentService,
  CourseService,
} = require("../services");

//Controllers
const {
  UserController,
  StudentController,
  ProfessorController,
  PaymentController,
  CourseController,
} = require("../controllers");

//Startup
const { Database, Server } = require("../startup");

//Routes
const {
  UserRoutes,
  StudentRoutes,
  ProfessorRoutes,
  PaymentRoutes,
  CourseRoutes,
} = require("../routes/api/index");

//Models
const {
  Association,
  User,
  Student,
  Professor,
  Payment,
  Course,
  CourseStudent,
  Attendance,
  Grades,
} = require("../models");

const { protect } = require("../middleware/authMiddleware");
const AuthUtils = require("../utils/auth");
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
  })
  .register({
    //Configuración de rutas
    UserRoutes: asFunction(UserRoutes).singleton(),
    StudentRoutes: asFunction(StudentRoutes).singleton(),
    ProfessorRoutes: asFunction(ProfessorRoutes).singleton(),
    PaymentRoutes: asFunction(PaymentRoutes).singleton(),
    CourseRoutes: asFunction(CourseRoutes).singleton(),
  })
  .register({
    //Configuración de las asociaciones
    Association: asClass(Association).singleton(),
  })
  .register({
    //Configuración de modelos
    User: asClass(User).singleton(),
    Student: asClass(Student).singleton(),
    Professor: asClass(Professor).singleton(),
    Payment: asClass(Payment).singleton(),
    Course: asClass(Course).singleton(),
    CourseStudent: asClass(CourseStudent).singleton(),
    Attendance: asClass(Attendance).singleton(),
    Grades: asClass(Grades).singleton(),
  })
  .register({
    //middlewares
    AuthMiddleware: asFunction(protect).singleton(),
  });

module.exports = container;
