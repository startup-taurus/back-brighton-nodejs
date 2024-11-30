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
};
