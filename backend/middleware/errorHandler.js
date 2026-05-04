module.exports = function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate value', field: Object.keys(err.keyPattern || {})[0] });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
};
