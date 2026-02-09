const { param } = require('express-validator');

exports.idValidator = [
  param('id', 'Invalid id').isMongoId()
];
