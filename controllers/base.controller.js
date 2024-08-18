const catchControllerAsync = require("../utils/catch-controller-async");

module.exports = class BaseController {
  constructor(service) {
    this.service = service;
  }

  getOne = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.service.getOne(id);
    res.status(200).send(result[0]);
  });

  getAll = catchControllerAsync(async (req, res) => {
    const { page, limit } = req.query;
    const result = await this.service.getAll(limit, page);
    res.status(200).send(result);
  });

  create = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const result = await this.service.create(body);
    res.status(200).send(result);
  });

  update = catchControllerAsync(async (req, res) => {
    const { body } = req;
    const { id } = req.params;
    const result = await this.service.update(id, body);
    res.send(result);
  });

  delete = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.service.delete(id);
    res.send(result);
  });
};
