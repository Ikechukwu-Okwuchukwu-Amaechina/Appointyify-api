const { query } = require('express-validator');

exports.dateQueryValidator = [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
];
