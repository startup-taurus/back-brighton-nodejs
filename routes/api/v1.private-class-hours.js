const { Router } = require('express');

module.exports = function ({ PrivateClassHoursController }) {
  const router = Router();
  
  router.get('/course/:id', PrivateClassHoursController.getPrivateClassesByCourse);

  router.get('/student/:studentId', PrivateClassHoursController.getPrivateClassesByStudent);

  router.get('/stats/:id', PrivateClassHoursController.getPrivateClassStats);

  router.post('/create', PrivateClassHoursController.createPrivateClass);
  
  router.post('/bulk-create/:id', PrivateClassHoursController.createMultiplePrivateClasses);
  
  router.put('/update/:id', PrivateClassHoursController.updatePrivateClass);
  
  router.delete('/delete/:id', PrivateClassHoursController.deletePrivateClass);
  
  
  
  return router;
};