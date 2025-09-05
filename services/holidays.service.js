const BaseService = require('./base.service');
const catchServiceAsync = require('../utils/catch-service-async');
const { validateParameters } = require('../utils/utils');
let _holidays = null;

module.exports = class HolidaysService extends BaseService {
  constructor({ Holidays }) {
    super(Holidays);
    _holidays = Holidays.Holidays;
  }

  getAllHolidays = catchServiceAsync(async (page = 1, limit = 10) => {
    let limitNumber = parseInt(limit);
    let pageNumber = parseInt(page);
    const data = await _holidays.findAndCountAll({
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      order: [['id', 'DESC']],
    });

    return {
      data: {
        result: data.rows,
        totalCount: data.count,
      },
    };
  });

  getAllActiveHolidays = catchServiceAsync(async () => {
    const data = await _holidays.findAll({
      where: { status: 'active' },  
      order: [['holiday_date', 'ASC']],
    });

    return {
      data,
    };
  });

  getHoliday = catchServiceAsync(async (id) => {
    const holiday = await _holidays.findByPk(id, { raw: true });
    if (!holiday) {
      throw new AppError('Holiday not found', 404);
    }
    return {
      data: holiday,
    };
  });

  createHoliday = catchServiceAsync(async (body) => {
    const { holiday_name, holiday_date, holiday_type, status } = body;
    validateParameters({ holiday_name, holiday_date, holiday_type, status });
    const holiday = await _holidays.create(body);
    return { data: holiday };
  });

  updateHoliday = catchServiceAsync(async (id, body) => {
    const { holiday_name, holiday_date, holiday_type, status } = body;
    validateParameters({
      id,
      holiday_name,
      holiday_date,
      holiday_type,
      status,
    });
    const holiday = await _holidays.update(body, { where: { id: id } });
    return { data: holiday };
  });

  updateHolidayStatus = catchServiceAsync(async (id, body) => {
    const { status } = body;
    validateParameters({ id, status });
    const holiday = await _holidays.update({ status }, { where: { id } });
    return { data: holiday };
  });

  deleteHoliday = catchServiceAsync(async (id) => {
    const holiday = await _holidays.destroy({
      where: { id: id },
    });
    return {
      data: holiday,
    };
  });
};
