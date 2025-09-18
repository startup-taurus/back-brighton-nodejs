const AppError = require('./app-error');
const { DAYS_OF_WEEK } = require('./constants');

function isHoliday(dateToCheck, holidays = []) {
  if (!dateToCheck || isNaN(dateToCheck.getTime())) {
    return false;
  }

  return holidays.some((holiday) => {
    if (!holiday || !holiday.holiday_date) {
      return false;
    }

    let holidayDate;
    if (holiday.holiday_date instanceof Date) {
      holidayDate = holiday.holiday_date;
    } else {
      const dateStr = holiday.holiday_date.toString().split('T')[0];
      const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
      holidayDate = new Date(year, month - 1, day);
    }
    
    if (isNaN(holidayDate.getTime())) {
      return false;
    }
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
      Mon: 'Monday',
      Tue: 'Tuesday',
      Wed: 'Wednesday',
      Thu: 'Thursday',
      Fri: 'Friday',
      Sat: 'Saturday',
      Sun: 'Sunday',
    };
    const [daysPart, timePart] = scheduleString.split(' ');
    const [startTime, endTime] = timePart.split('-');

    const days = daysPart.split('-').map((day) => daysMap[day]);
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
  
    if (!hourlyRate || typeof hourlyRate !== 'string') {
      return [];
    }
  
    const parts = hourlyRate.split(' ');
    if (parts.length < 2) {
      return [];
    }
  
    const [days] = parts;
  
    const classDays = days.split('-').map((day) => daysMap[day]).filter(day => day !== undefined);
    
    if (classDays.length === 0) {
      return [];
    }
  
    let year, month, day;
    
    if (typeof startDate === 'string') {
      if (startDate.includes('/')) {
        const [dayStr, monthStr, yearStr] = startDate.split('/');
        day = parseInt(dayStr, 10);
        month = parseInt(monthStr, 10);
        year = parseInt(yearStr, 10);
      }
      else if (startDate.includes('-')) {
        const [yearStr, monthStr, dayStr] = startDate.split('-');
        year = parseInt(yearStr, 10);
        month = parseInt(monthStr, 10);
        day = parseInt(dayStr, 10);
      }
      else {
        return [];
      }
    } else {
      return [];
    }
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return [];
    }
  
    let currentDate = new Date(year, month - 1, day);
    
    if (isNaN(currentDate.getTime())) {
      return [];
    }
  
    const dates = [];

    syllabusItems.forEach(() => {
      while (
        !classDays.includes(currentDate.getDay()) ||
        isHoliday(currentDate, holidays)
      ) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      const classDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
      
      dates.push(classDate);
      currentDate.setDate(currentDate.getDate() + 1);
    });
  
    return dates;
  },

  generateCredentials(name, cedula) {
    const normalizedName = name
      .trim()
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0))
      .join('');

    const username = `${normalizedName}${cedula.slice(-4)}`;
    const randomString = Math.random().toString(36).slice(-8);
    const password = `${cedula.slice(0, 3)}${randomString}!`;
    return { username, password };
  },

  countAttendance(attendances = []) {
    const attendanceTotal = attendances.reduce((acc, attendance) => {
      if (attendance.status === 'present' || attendance.status === 'recovered')
        return acc++;
      if (attendance.status === 'late') return acc + 0.5;
      return acc;
    }, 0);

    return Math.floor(attendanceTotal);
  },

  hasClassToday(day) {
    const currentDay = new Date().getDay();

    return currentDay === DAYS_OF_WEEK[day];
  },

  validateEmailFormat(email) {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        message: 'Email is required and must be a string'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: 'Invalid email format'
      };
    }

    return {
      isValid: true,
      message: 'Valid email format'
    };
  },
};