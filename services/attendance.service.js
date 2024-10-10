const BaseService = require("./base.service");
const catchServiceAsync = require("../utils/catch-service-async");
const { validateParameters } = require("../utils/utils");
let _user = null;
let _course = null;
let _student = null;
let _attendance = null;
module.exports = class AttendanceService extends BaseService {
  constructor({ Attendance, User, Professor, Course, Student, UserService }) {
    super(Attendance);
    _user = User.User;
    _course = Course.Course;
    _student = Student.Student;
    _attendance = Attendance.Attendance;
  }

  getAttendanceByCourse = catchServiceAsync(async (courseId) => {
    const attendanceRecords = await _attendance.findAll({
      where: { course_id: courseId },
      include: [
        {
          model: _student,
          as: "student",
          include: [
            {
              model: _user,
              as: "user",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!attendanceRecords || attendanceRecords.length === 0) {
      throw new AppError("No attendance records found for this course", 404);
    }
    const formattedRecords = attendanceRecords.map((attendance) => ({
      id: attendance.id,
      course_id: attendance.course_id,
      student_id: attendance.student_id,
      student: attendance.student.user.name,
      status: attendance.status,
      attendance_date: attendance.attendance_date,
    }));

    return { data: formattedRecords };
  });

  createAttendance = catchServiceAsync(async (body) => {
    const { course_id, student_id, attendance_date, status } = body;

    validateParameters({ course_id, student_id, attendance_date, status });

    const attendance = await _attendance.create({
      course_id,
      student_id,
      attendance_date,
      status,
    });

    return { data: attendance };
  });
};
