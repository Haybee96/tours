const e = require('express');
const AppError = require('./../utils/appError');
// const { isValidObjectId } = require('mongoose');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `${value} already exist .Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTErrorDB = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again!', 401);

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // RENDERED WEBSITE
  console.error('Error 💥️:', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });

};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: visible to clients
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
  
    }
    // Programming or other error: hidden from clients
    // Log the error
    console.error('ERROR 💥️', err);
  
    // Generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  
  }
  // RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });

  }
  // Programming or other error: hidden from clients
  // Log the error
  console.error('ERROR 💥️', err);

  // Generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Destructure - creating an hard copy
    let error = { ...err };
    error.message = err.message;

    // Handle CastError DB - object ID not found
    // if (!isValidObjectId(error.value)) error = handleCastErrorDB(error);
    if (error.name === 'CastError') error = handleCastErrorDB(error);

    // Handle DuplicateError DB
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // Handle ValidatiorError DB
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

    // Json web token error - invalid signature
    if (error.name === 'JsonWebTokenError') error = handleJWTErrorDB();

    // Token expired error
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(error);

    sendErrorProd(error, req, res);
  }
  next();
};
