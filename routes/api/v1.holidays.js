const { Router } = require('express');
const { requireRoles } = require('../../middleware/teacherMiddleware');
const { USER_TYPES } = require('../../utils/constants')

module.exports = function ({ HolidaysController, AuthMiddleware }) {
  const router = Router();
  router.get('/get-all', [AuthMiddleware,
    requireRoles(USER_TYPES.COORDINATOR, USER_TYPES.ADMIN)],HolidaysController.getAllHolidays);
  router.get('/get-all-active', HolidaysController.getAllActiveHolidays);
  router.get('/get-one/:id', HolidaysController.getHoliday);
  router.post('/create', HolidaysController.createHoliday);
  router.put('/update/:id', HolidaysController.updateHoliday);
  router.put('/update-status/:id', HolidaysController.updateHolidayStatus);
  router.delete('/delete/:id', HolidaysController.deleteHoliday);
  router.post('/recalculate-schedules', [AuthMiddleware,
    requireRoles(USER_TYPES.ADMIN)], HolidaysController.recalculateAllSchedules);
  
  return router;
};
