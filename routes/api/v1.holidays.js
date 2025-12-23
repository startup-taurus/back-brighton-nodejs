const { Router } = require('express');
const { requirePermissions } = require('../../middleware/teacherMiddleware');
const { PERMISSIONS } = require('../../utils/permissions');

module.exports = function ({ HolidaysController, AuthMiddleware }) {
  const router = Router();
  router.get(
    '/get-all',
    [AuthMiddleware, requirePermissions(PERMISSIONS.VIEW_HOLIDAYS)],
    HolidaysController.getAllHolidays
  );
  router.get('/get-all-active', HolidaysController.getAllActiveHolidays);
  router.get('/get-one/:id', HolidaysController.getHoliday);
  router.post('/create', HolidaysController.createHoliday);
  router.put('/update/:id', HolidaysController.updateHoliday);
  router.put('/update-status/:id', HolidaysController.updateHolidayStatus);
  router.delete('/delete/:id', HolidaysController.deleteHoliday);
  return router;
};
