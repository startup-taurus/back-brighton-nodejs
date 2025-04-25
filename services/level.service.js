const catchServiceAsync = require('../utils/catch-service-async');
const BaseService = require('./base.service');
const AppError = require('../utils/app-error');

let _level = null;

module.exports = class LevelService extends BaseService {
  constructor({ Level }) {
    super(Level);
    _level = Level.Level;
  }

  getAllLevels = catchServiceAsync(async (query) => {
    const { page = 1, limit = 10 } = query;

    const limitNumber = parseInt(limit);
    const pageNumber = parseInt(page);

    const { count, rows } = await _level.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      order: [['full_level', 'ASC']],
    });

    return {
      data: {
        result: rows,
        totalCount: count,
      },
    };
  });

  getLevel = catchServiceAsync(async (id) => {
    const level = await _level.findByPk(id);

    if (!level) {
      throw new AppError('Level not found', 404);
    }

    return {
      data: level,
    };
  });

  createLevel = catchServiceAsync(async (body) => {
    const { full_level, short_level } = body;

    const level = await _level.create({
      full_level,
      short_level,
    });

    return { data: level };
  });

  updateLevel = catchServiceAsync(async (id, body) => {
    const { full_level, short_level } = body;

    const level = await _level.findByPk(id);

    if (!level) {
      throw new AppError('Level not found', 404);
    }

    await _level.update(
      {
        full_level,
        short_level,
      },
      { where: { id } }
    );

    const updatedLevel = await _level.findByPk(id);

    return { data: updatedLevel };
  });

  deleteLevel = catchServiceAsync(async (id) => {
    const level = await _level.findByPk(id);

    if (!level) {
      throw new AppError('Level not found', 404);
    }

    await _level.destroy({ where: { id } });

    return { message: 'Level deleted successfully' };
  });
};
