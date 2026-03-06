const Joi = require('joi');

// Adding regex to enforce password complexity and phone number length!
// Trying to avoid 500 errors by failing early in Joi.
const registerSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Include a valid email'
  }),
  password: Joi.string()
    .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 8 chars, 1 uppercase, 1 lowercase, and 1 number'
    }),
  role: Joi.string().valid('user', 'business', 'admin').optional(),
  phone: Joi.string().pattern(/^\d{10,15}$/).optional().messages({
    'string.pattern.base': 'Phone number must be between 10 and 15 digits only'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.registerValidator = (req, res, next) => {
  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ errors: error.details.map(err => ({ msg: err.message })) });
  }
  next();
};

exports.loginValidator = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ errors: error.details.map(err => ({ msg: err.message })) });
  }
  next();
};
