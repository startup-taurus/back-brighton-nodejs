const catchControllerAsync = require("../utils/catch-controller-async");
const BaseController = require("./base.controller");
const { appResponse } = require("../utils/app-response");
let _paymentService = null;
module.exports = class PaymentController extends BaseController {
  constructor({ PaymentService }) {
    super(PaymentService);
    _paymentService = PaymentService;
  }

  getPaymentByUser = catchControllerAsync(async (req, res) => {
    const { id } = req.params;
    const result = await _paymentService.getPaymentByUser(id);
    return appResponse(res, result);
  });
  
  createPayment = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const result = await _paymentService.createPayment(body);
    return appResponse(res, result);
  });

  updatePayment = catchControllerAsync(async (req, res) => {
    const body = req.body;
    const { id } = req.params;
    const result = await _paymentService.updatePayment(id, body);
    return appResponse(res, result);
  });
};
