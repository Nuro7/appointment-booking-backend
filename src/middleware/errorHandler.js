const logger = require('../config/logger');

/**
 * Central error-handling middleware.
 * Must be registered LAST in the Express pipeline (4 args).
 *
 * Maps known error types to meaningful HTTP codes so controllers never
 * need to hard-code status codes themselves.
 */
const errorHandler = (err, req, res, next) => {  // eslint-disable-line no-unused-vars
    // Supabase / PostgREST error codes
    const PGRST_NOT_FOUND = 'PGRST116';

    // Default to 500
    let status = err.status || err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code || 'INTERNAL_ERROR';

    // ── Known Mappings ──────────────────────────────────────────────────────────

    // Supabase not-found
    if (err.code === PGRST_NOT_FOUND || message.toLowerCase().includes('not found')) {
        status = 404;
        code = 'NOT_FOUND';
    }

    // Supabase unique violation (duplicate slot)
    if (err.code === '23505') {
        status = 409;
        code = 'CONFLICT';
        message = 'A time slot with these exact details already exists.';
    }

    // Slot availability conflict (our own throw)
    if (message.includes('no longer available') || message.includes('already booked')) {
        status = 409;
        code = 'SLOT_UNAVAILABLE';
    }

    // DB not configured
    if (message.includes('Database not configured')) {
        status = 503;
        code = 'DB_NOT_CONFIGURED';
    }

    // Joi / validation errors that bubble up manually
    if (err.isJoi) {
        status = 422;
        code = 'VALIDATION_ERROR';
        message = err.details?.map((d) => d.message).join('; ') || message;
    }

    // JSON parse error from Express
    if (err.type === 'entity.parse.failed') {
        status = 400;
        code = 'INVALID_JSON';
        message = 'Request body contains invalid JSON.';
    }

    // Request payload too large
    if (err.type === 'entity.too.large') {
        status = 413;
        code = 'PAYLOAD_TOO_LARGE';
        message = 'Request payload exceeds the allowed size limit.';
    }

    // CORS error
    if (message.startsWith('CORS blocked')) {
        status = 403;
        code = 'CORS_BLOCKED';
    }

    // ── Log ─────────────────────────────────────────────────────────────────────
    const logMeta = {
        method: req.method,
        url: req.originalUrl,
        status,
        code,
        ip: req.ip,
    };

    if (status >= 500) {
        logger.error(message, { ...logMeta, stack: err.stack });
    } else {
        logger.warn(message, logMeta);
    }

    // ── Response ─────────────────────────────────────────────────────────────────
    const body = {
        success: false,
        code,
        message,
    };

    // Only expose stack in development
    if (process.env.NODE_ENV === 'development' && status >= 500 && err.stack) {
        body.stack = err.stack;
    }

    res.status(status).json(body);
};

module.exports = errorHandler;
