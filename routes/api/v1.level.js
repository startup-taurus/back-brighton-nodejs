const { Router } = require('express');

module.exports = function ({ LevelController }) {
  const router = Router();
  router.get('/get-all', LevelController.getAllLevels);
  router.get('/get-one/:id', LevelController.getLevel);
  router.post('/create', LevelController.createLevel);
  router.put('/update/:id', LevelController.updateLevel);
  router.delete('/delete/:id', LevelController.deleteLevel);
  return router;
};
