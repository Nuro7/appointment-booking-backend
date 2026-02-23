const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Creates a standard rate limiter with a shared handler.
 */
const createLimiter = ({ windowMs, max, message, name }) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false,     // Disable the `X-RateLimit-*` headers
        skipSuccessfulRequests: false,
        handler: (req, res) => {
            logger.warn(`Rate limit hit [${name}]`, { ip: req.ip, url: req.originalUrl });
            res.status(429).json({
                success: false,
                code: 'RATE_LIMITED',
                message,
                retryAfter: Math.ceil(windowMs / 1000),
            });
        },
    });

// ─── Global limiter — applied to all routes ───────────────────────────────────
const globalLimiter = createLimiter({
    name: 'global',
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 300,                   // 300 requests per 15 min per IP
    message: 'Too many requests from this IP. Please wait 15 minutes before retrying.',
});

// ─── Write limiter — applied to POST / PUT / DELETE ───────────────────────────
const writeLimiter = createLimiter({
    name: 'write',
    windowMs: 1 * 60 * 1000,   // 1 minute
    max: 30,                    // 30 writes per minute
    message: 'Too many write operations. Please slow down and try again shortly.',
});

// ─── Booking limiter — applied specifically to POST /:id/book ─────────────────
const bookingLimiter = createLimiter({
    name: 'booking',
    windowMs: 10 * 60 * 1000,  // 10 minutes
    max: 10,                    // 10 bookings per 10 min per IP
    message: 'Too many booking attempts. Please wait 10 minutes before trying again.',
});

module.exports = { globalLimiter, writeLimiter, bookingLimiter };
