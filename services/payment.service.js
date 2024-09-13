const catchServiceAsync = require("../utils/catch-service-async");
const BaseService = require("./base.service");
const AppError = require("../utils/app-error");
const { validateParameters } = require("../utils/utils");
let _payment = null;
module.exports = class PaymentService extends BaseService {
  constructor({ Payment }) {
    super(Payment);
    _payment = Payment.Payment;
  }

  getPaymentByUser = catchServiceAsync(async (id) => {
    const result = await _payment.findAll({
      where: { student_id: id },
    });
    return { data: result };
  });

  createPayment = catchServiceAsync(async (body) => {
    validateParameters(body);
    const transformedBody = this.transformPaymentBody(body);
    const result = await _payment.create(transformedBody);
    return { data: result };
  });

  updatePayment = catchServiceAsync(async (id, body) => {
    validateParameters(body);
    const transformedBody = this.transformPaymentBody(body);
    const result = await _payment.update(transformedBody, {
      where: { id: id },
    });
    return { data: result };
  });

  transformPaymentBody = (body) => {
    body.student_id = body.studentId;
    body.payment_date = body.paymentDate;
    body.payment_method = body.paymentMethod;
    body.total_payment = body.totalPayment;
    body.hours_charged = body.hoursCharged;

    delete body.studentId;
    delete body.paymentDate;
    delete body.paymentMethod;
    delete body.totalPayment;
    delete body.hoursCharged;

    return body;
  };
};
