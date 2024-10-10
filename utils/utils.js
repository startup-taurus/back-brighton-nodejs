const AppError = require("./app-error");

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
};
