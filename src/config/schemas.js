const Joi = require('joi');

// ─── Reusable primitives ───────────────────────────────────────────────────────
const dateStr = Joi.string()
    .pattern(/^\d{4}-([0][1-9]|[1][0-2])-([0][1-9]|[12]\d|[3][01])$/)
    .messages({ 'string.pattern.base': '{{#label}} must be a valid date in YYYY-MM-DD format' });

const timeStr = Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .messages({ 'string.pattern.base': '{{#label}} must be in HH:MM or HH:MM:SS format' });

const uuidStr = Joi.string().uuid({ version: ['uuidv4'] });

const emailStr = Joi.string().email({ tlds: { allow: false } }).lowercase().trim();

// ─── Slot Schemas ──────────────────────────────────────────────────────────────

/**
 * POST /api/slots  — create a single time slot
 */
const createSlotSchema = Joi.object({
    date: dateStr.required(),
    start_time: timeStr.required(),
    end_time: timeStr.required(),
    title: Joi.string().trim().max(255).default('Appointment Slot'),
    description: Joi.string().trim().max(1000).allow('', null).optional(),
    duration_minutes: Joi.number().integer().min(5).max(480).default(30),
}).custom((value, helpers) => {
    // Ensure end_time > start_time
    const start = value.start_time.slice(0, 5);
    const end = value.end_time.slice(0, 5);
    if (end <= start) {
        return helpers.error('any.invalid', { message: 'end_time must be after start_time' });
    }
    return value;
}).messages({ 'any.invalid': 'end_time must be after start_time' });

/**
 * Item schema reused inside bulk array
 */
const bulkSlotItemSchema = Joi.object({
    date: dateStr.required(),
    start_time: timeStr.required(),
    end_time: timeStr.required(),
    title: Joi.string().trim().max(255).default('Appointment Slot'),
    description: Joi.string().trim().max(1000).allow('', null).optional(),
    duration_minutes: Joi.number().integer().min(5).max(480).default(30),
});

/**
 * POST /api/slots/bulk
 */
const bulkSlotsSchema = Joi.object({
    slots: Joi.array()
        .items(bulkSlotItemSchema)
        .min(1)
        .max(100)
        .required()
        .messages({
            'array.max': 'Cannot create more than 100 slots in a single request',
            'array.min': 'slots array must have at least one item',
        }),
});

/**
 * PUT /api/slots/:id  — allow partial updates on permitted fields only
 */
const updateSlotSchema = Joi.object({
    title: Joi.string().trim().max(255),
    description: Joi.string().trim().max(1000).allow('', null),
    status: Joi.string().valid('available', 'blocked'),   // can't manually set "booked"
    duration_minutes: Joi.number().integer().min(5).max(480),
    start_time: timeStr,
    end_time: timeStr,
}).min(1).messages({ 'object.min': 'Request body must contain at least one updatable field' });

// ─── Query Schemas ─────────────────────────────────────────────────────────────

const dateQuerySchema = Joi.object({
    date: dateStr.required(),
});

const rangeQuerySchema = Joi.object({
    startDate: dateStr.required(),
    endDate: dateStr.required(),
}).custom((value, helpers) => {
    if (value.endDate < value.startDate) {
        return helpers.error('any.invalid', { message: 'endDate must be on or after startDate' });
    }
    return value;
}).messages({ 'any.invalid': 'endDate must be on or after startDate' });

const availabilityQuerySchema = Joi.object({
    year: Joi.number().integer().min(2020).max(2100).required(),
    month: Joi.number().integer().min(1).max(12).required(),
});

const idParamSchema = Joi.object({
    id: uuidStr.required().messages({ 'string.guid': 'id must be a valid UUID' }),
});

// ─── Booking Schema ────────────────────────────────────────────────────────────

const bookSlotSchema = Joi.object({
    client_name: Joi.string().trim().min(2).max(150).required(),
    client_email: emailStr.required(),
    client_phone: Joi.string().trim().max(30).pattern(/^[+\d\s\-().]{7,30}$/).allow('', null).optional()
        .messages({ 'string.pattern.base': 'client_phone contains invalid characters' }),
    notes: Joi.string().trim().max(1000).allow('', null).optional(),
});

module.exports = {
    createSlotSchema,
    bulkSlotsSchema,
    updateSlotSchema,
    dateQuerySchema,
    rangeQuerySchema,
    availabilityQuerySchema,
    idParamSchema,
    bookSlotSchema,
};
