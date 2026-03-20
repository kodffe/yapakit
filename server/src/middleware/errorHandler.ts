import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handling middleware for returning standardized JSON responses.
 */
import fs from 'fs';

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  const errorLog = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\nError: ${err.message}\nStack: ${err.stack}\n\n`;
  try {
    fs.appendFileSync('/tmp/yapakit_error.log', errorLog);
  } catch (e) {
    console.error('Failed to write to error log', e);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export default errorHandler;
