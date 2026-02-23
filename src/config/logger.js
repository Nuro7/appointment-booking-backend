const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ─── Custom dev format ─────────────────────────────────────────────────────────
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n  ${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}] ${stack || message}${metaStr}`;
});

const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    defaultMeta: { service: 'appointment-api' },

    transports: [
        // ── Console (always on) ─────────────────────────────────────────────────
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: 'HH:mm:ss' }),
                errors({ stack: true }),
                isProduction ? json() : devFormat
            ),
        }),

        // ── Persistent error log ─────────────────────────────────────────────────
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024,  // 5 MB
            maxFiles: 5,
            format: combine(timestamp(), errors({ stack: true }), json()),
        }),

        // ── Combined log ─────────────────────────────────────────────────────────
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 10 * 1024 * 1024, // 10 MB
            maxFiles: 7,
            format: combine(timestamp(), errors({ stack: true }), json()),
        }),
    ],

    // Prevent crashing on uncaught exceptions inside winston itself
    exitOnError: false,
});

module.exports = logger;
