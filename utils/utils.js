const AppError = require("./app-error");

function isHoliday(dateToCheck, holidays = []) {
  return holidays.some((holiday) => {
    const holidayDate = new Date(holiday.holiday_date);
    return (
      holidayDate.getFullYear() === dateToCheck.getFullYear() &&
      holidayDate.getMonth() === dateToCheck.getMonth() &&
      holidayDate.getDate() === dateToCheck.getDate()
    );
  });
}

module.exports = {
  validateParameters(params, customMessage) {
    for (const [key, value] of Object.entries(params)) {
      if (!value) {
        let message =
          customMessage ||
          `Los datos no se enviaron correctamente, es posible que falte el parámetro ${key}`;
        throw new AppError(message, 400);
      }
    }
  },

  scheduleStringToDates(scheduleString) {
    const daysMap = {
      Mon: "Monday",
      Tue: "Tuesday",
      Wed: "Wednesday",
      Thu: "Thursday",
      Fri: "Friday",
      Sat: "Saturday",
      Sun: "Sunday",
    };
    const [daysPart, timePart] = scheduleString.split(" ");
    const [startTime, endTime] = timePart.split("-");

    const days = daysPart.split("-").map((day) => daysMap[day]);
    return days.map((day) => ({
      day,
      startTime,
      endTime,
    }));
  },

  calculateClassDates(startDate, syllabusItems, hourlyRate, holidays) {
    const daysMap = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const [days, timeRange] = hourlyRate.split(" ");
    const [startTime] = timeRange.split("-");

    const classDays = days.split("-").map((day) => daysMap[day]);

    const [year, month, day] = startDate
      .split("-")
      .map((num) => parseInt(num, 10));

    let currentDate = new Date(year, month - 1, day);
    const dates = [];

    syllabusItems.forEach(() => {
      while (
        !classDays.includes(currentDate.getDay()) ||
        isHoliday(currentDate, holidays)
      ) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      const dateStr =
        currentDate.getFullYear() +
        "-" +
        String(currentDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(currentDate.getDate()).padStart(2, "0") +
        "T" +
        startTime;

      const classDate = new Date(dateStr);
      dates.push(classDate);
      currentDate.setDate(currentDate.getDate() + 1);
    });

    return dates;
  },

  generateCredentials(name, cedula) {
    const normalizedName = name
      .trim()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0))
      .join("");

    const username = `${normalizedName}${cedula.slice(-4)}`;
    const randomString = Math.random().toString(36).slice(-8);
    const password = `${cedula.slice(0, 3)}${randomString}!`;
    return { username, password };
  },

  countAttendance(attendances = []) {
    const attendanceTotal = attendances.reduce((acc, attendance) => {
      if (attendance.status === "present" || attendance.status === "recovery")
        return acc++;
      if (attendance.status === "late") return acc + 0.5;
      return acc;
    }, 0);

    return Math.floor(attendanceTotal);
  },
};
