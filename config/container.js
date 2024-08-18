//Configurar nuestro contenedor de injección de depencia
const { createContainer, asClass, asValue, asFunction } = require("awilix");
const { Sequelize } = require("sequelize");
//Config
const config = require(".");

//Routes
const Routes = require("../routes");

//Services
const { UserService, StudentService } = require("../services");

//Controllers
const { UserController, StudentController } = require("../controllers");

//Startup
const { Database, Server } = require("../startup");

//Routes
const { UserRoutes, StudentRoutes } = require("../routes/api/index");

//Models
const { User, Student } = require("../models");

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
  })
  .register({
    //Configuración de los controladores
    UserController: asClass(UserController.bind(UserController)).singleton(),
    StudentController: asClass(
      StudentController.bind(StudentController)
    ).singleton(),
  })
  .register({
    //Configuración de rutas
    UserRoutes: asFunction(UserRoutes).singleton(),
    StudentRoutes: asFunction(StudentRoutes).singleton(),
  })
  .register({
    //Configuración de modelos
    User: asClass(User).singleton(),
    Student: asClass(Student).singleton(),
  })
  .register({
    //middlewares
    AuthMiddleware: asFunction(protect).singleton(),
  });

module.exports = container;
