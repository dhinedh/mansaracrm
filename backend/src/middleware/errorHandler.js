// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ') || 'Validation error',
      errors: err.errors
    });
  }

  // MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'record';
    const val = err.keyValue ? err.keyValue[field] : '';
    return res.status(400).json({
      success: false,
      message: `A record with this ${field}${val ? ` ("${val}")` : ''} already exists.`,
      field
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format or identifier for ${err.path || 'field'}: "${err.value}"`
    });
  }

  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    message,
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
