const errorMiddleware = (err, req, res, next) => {
  console.error('ERROR DETECTADO:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let errors = null;

  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Datos de entrada inválidos';
    const issues = err.errors || err.issues || [];
    errors = issues.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
  }

  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue)[0];
    message = `El valor para "${duplicatedField}" ya existe`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `ID inválido: ${err.value}`;
  }

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;