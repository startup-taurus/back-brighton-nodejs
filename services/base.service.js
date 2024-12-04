const AppError = require('../utils/app-error');
const catchServiceAsync = require('../utils/catch-service-async');
module.exports = class BaseService {
  constructor(model) {
    this.model = model;
  }

  getOne = catchServiceAsync(async (id) => {
    if (!id) {
      throw new AppError('Id must be sent', 400);
    }
    const currentEntity = await this.model.findById(id);
    if (!currentEntity) {
      throw new AppError('Entity does not found', 404);
    }
    return currentEntity;
  });

  getAll = catchServiceAsync(async (limit = 10, pageNum = 1) => {
    const pagination = limit * (pageNum - 1);
    const totalCount = await this.model.countDocuments();
    const data = await this.model.find().lean().skip(pagination).limit(limit);
    return { data, totalCount };
  });

  create = catchServiceAsync(async (entity) => {
    return await this.model.create(entity);
  });

  update = catchServiceAsync(async (id, entity) => {
    try {
      if (!id) {
        throw new AppError('Id must be sent', 400);
      }
      return await this.model.update(entity, { where: { id } });
    } catch (e) {
      throw new AppError('Something is wrong, contact to support!', 400);
    }
  });

  delete = catchServiceAsync(async (id) => {
    try {
      if (!id) {
        throw new AppError('Id must be sent', 400);
      }
      return await this.model.destroy({ where: { id } });
    } catch (e) {
      console.log(e);
    }
  });
};
