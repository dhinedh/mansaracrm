// src/middleware/validator.js
const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../../errors.log');
    const logMsg = `[Validation Failed] ${new Date().toISOString()} - URL: ${req.originalUrl} - Body: ${JSON.stringify(req.body)} - Errors: ${JSON.stringify(errors.array())}\n`;
    try {
      fs.appendFileSync(logPath, logMsg);
    } catch (e) {
      console.error('Failed to write to errors.log:', e);
    }

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  };
};

module.exports = validate;
