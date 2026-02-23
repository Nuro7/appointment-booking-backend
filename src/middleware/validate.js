const logger = require('../config/logger');

/**
 * Joi validation middleware factory.
 *
 * Usage:
 *   router.post('/', validate({ body: createSlotSchema }), controller.createSlot);
 *
 * @param {{ body?, query?, params? }} schemas  - Joi schemas for each request section
 * @returns Express middleware
 */
const validate = (schemas) => (req, res, next) => {
    const errors = [];

    for (const section of ['params', 'query', 'body']) {
        if (!schemas[section]) continue;

        const { error, value } = schemas[section].validate(req[section], {
            abortEarly: false,    // collect ALL errors, not just the first
            allowUnknown: false,  // reject unexpected fields
            stripUnknown: true,   // strip unknown fields after validation passes
            convert: true,        // coerce "30" → 30 for number fields etc.
        });

        if (error) {
            error.details.forEach((d) => {
                errors.push({ field: d.path.join('.'), message: d.message.replace(/['"]/g, '') });
            });
        } else {
            // Replace request section with the sanitized/coerced value
            req[section] = value;
        }
    }

    if (errors.length > 0) {
        logger.warn('Validation failed', { url: req.originalUrl, method: req.method, errors });
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
    }

    next();
};

module.exports = validate;
