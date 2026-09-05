export function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}`, errors: [] });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(', ');
    return res.status(409).json({
      success: false,
      message: `A record with this ${field || 'value'} already exists.`,
      errors: [],
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier supplied.', errors: [] });
  }

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error.'
      : err.message || 'Internal server error.';

  res.status(status).json({ success: false, message, errors: err.errors || [] });
}

export class ApiError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
