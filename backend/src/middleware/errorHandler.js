import logger from "../utils/logger.js";
export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(err, req, res, next) {
  logger.error(err);
  if (res.headersSent) return next(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : err.message
  });
}
