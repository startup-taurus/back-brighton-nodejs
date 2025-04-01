const patterns = {
  alphanumeric: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.,0-9\-]+$/,
  alphanumericOrEmpty: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.,0-9\-]*$/,
  positiveNumber: /^[1-9][0-9]*$/,
  alphabetic: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
  iso8601Date: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  positiveNumberWithLeadingZero: /^0*[1-9][0-9]*$/,
  decimalNumberWithTwoDecimals: /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
  alphanumericNoSpecialChars: /^[a-zA-Z0-9]+$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  booleanValue: /^(true|false)$/,
  binaryStringPattern: /^[01]*$/,
};

const commonValidations = [
  {
    field: 'page',
    options: { required: false, pattern: patterns.positiveNumber },
  },
  {
    field: 'pageSize',
    options: { required: false, pattern: patterns.positiveNumber },
  },
  { field: 'fromDate', options: { required: false, date: true } },
  { field: 'toDate', options: { required: false, date: true } },
];

module.exports = { patterns, commonValidations };
