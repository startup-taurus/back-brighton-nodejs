// const catchControllerAsync = require("../utils/catch-controller-async");
// const BaseController = require("./base.controller");
// let _exampleService = null;
// module.exports = class ExampleController extends BaseController {
//   constructor({ ExampleService }) {
//     super(ExampleService);
//     _exampleService = ExampleService;
//   }
//   hello = catchControllerAsync(async (req, res) => {
//     const result = await _exampleService.hello();
//     res.status(200).send(result);
//   })
// };
