const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { ErrorMiddleware } = require('../middleware');
// const swaggerUI = require("swagger-ui-express");
//const authMiddleware = require("../middlewares/auth.middleware");
// const { SWAGGER_PATH } = require("../config");
//const swaggerDocument = require(SWAGGER_PATH);

module.exports = function ({
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
}) {
  const router = express.Router();
  const apiRouter = express.Router();

  apiRouter
    .use(express.json())
    .use(cors())
    .use(morgan('dev'))
    .use(express.urlencoded({ extended: true }));

  apiRouter.use('/user', UserRoutes);
  apiRouter.use('/level', LevelRoutes);
  apiRouter.use('/course', CourseRoutes);
  apiRouter.use('/payment', PaymentRoutes);
  apiRouter.use('/student', StudentRoutes);
  apiRouter.use('/holidays', HolidaysRoutes);
  apiRouter.use('/syllabus', SyllabusRoutes);
  apiRouter.use('/professor', ProfessorRoutes);
  apiRouter.use('/attendance', AttendanceRoutes);
  apiRouter.use('/private-class-hours', PrivateClassHoursRoutes);
  apiRouter.use('/transfer-data', TransferDataRoutes);
  apiRouter.use('/student-grades', StudentGradesRoutes);
  apiRouter.use('/course-schedule', CourseScheduleRoutes);
  apiRouter.use('/cancelled-lesson', CancelledLessonRoutes);
  apiRouter.use('/student-transfer', StudentTransferRoutes);
  apiRouter.use('/registered-student', RegisteredStudentRoutes);

  apiRouter.use('/images', express.static(path.join(__dirname, '../uploads')));
  router.use('/v1/api', apiRouter);

  //router.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
  // router.use(NotFoundMiddleware);
  router.use(ErrorMiddleware);

  return router;
};
