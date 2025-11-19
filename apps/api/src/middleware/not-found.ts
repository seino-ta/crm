import type { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';

const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(createError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export default notFoundHandler;
