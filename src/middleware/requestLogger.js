const logger = require('../config/logger');

/**
 * Attaches a unique requestId to every request and logs
 * method, route, status, and response time on completion.
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Attach a lightweight request ID (no external dep needed)
    req.requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    res.setHeader('X-Request-Id', req.requestId);

    // Log when the response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error'
            : res.statusCode >= 400 ? 'warn'
                : 'info';

        logger[level](`${req.method} ${req.originalUrl} → ${res.statusCode}`, {
            requestId: req.requestId,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
    });

    next();
};

module.exports = requestLogger;
