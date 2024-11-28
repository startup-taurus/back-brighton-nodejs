const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const { ErrorMiddleware } = require("../middleware");
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
  AttendanceRoutes,
  HolidaysRoutes,
  SyllabusRoutes,
}) {
  const router = express.Router();
  const apiRouter = express.Router();

  apiRouter
    .use(express.json())
    .use(cors())
    .use(morgan("dev"))
    .use(express.urlencoded({ extended: true }));

  apiRouter.use("/user", UserRoutes);
  apiRouter.use("/student", StudentRoutes);
  apiRouter.use("/professor", ProfessorRoutes);
  apiRouter.use("/payment", PaymentRoutes);
  apiRouter.use("/course", CourseRoutes);
  apiRouter.use("/attendance", AttendanceRoutes);
  apiRouter.use("/holidays", HolidaysRoutes);
  apiRouter.use("/syllabus", SyllabusRoutes);

  apiRouter.use("/images", express.static(path.join(__dirname, "../uploads")));
  router.use("/v1/api", apiRouter);
  router.use("/", (req, res) => {
    res.send("v.0.1.0.3");
  });
  //router.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
  // router.use(NotFoundMiddleware);
  router.use(ErrorMiddleware);

  return router;
};
