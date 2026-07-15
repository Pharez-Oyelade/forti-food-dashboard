import env from '../config/env.js';

/**
 * Custom application error with an HTTP status code.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error description.
   * @param {number} statusCode - HTTP status code (default 500).
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Express error-handling middleware.
 * Normalises various error types into a consistent JSON response.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = statusCode === 500 ? 'An unexpected internal error occurred.' : (err.message || 'Internal server error');
  let errors = undefined;

  // ── Mongoose Validation Error ──
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose CastError (invalid ObjectId, etc.) ──
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: "${err.value}"`;
  }

  // ── JWT Errors ──
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please log in again.';
  }

  // ── MongoDB Duplicate Key (code 11000) ──
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for "${field}". That ${field} is already taken.`;
  }

  // ── AppError ──
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log in development
  if (env.NODE_ENV === 'development') {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
