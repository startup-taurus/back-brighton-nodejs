const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const AppError = require("../utils/app-error");
let _example = null;
module.exports = class ExampleService extends BaseService {
  constructor({ Example }) {
    super(Example);
    _example = Example;
  }
  hello = catchServiceAsync(async () => {
    return { data: "hello" };
  });
};
