const { Router } = require('express');

module.exports = function ({ HolidaysController }) {
  const router = Router();
  router.get('/get-all', HolidaysController.getAllHolidays);
  router.get('/get-all-active', HolidaysController.getAllActiveHolidays);
  router.get('/get-one/:id', HolidaysController.getHoliday);
  router.post('/create', HolidaysController.createHoliday);
  router.put('/update/:id', HolidaysController.updateHoliday);
  router.put('/update-status/:id', HolidaysController.updateHolidayStatus);
  router.delete('/delete/:id', HolidaysController.deleteHoliday);
  return router;
};
