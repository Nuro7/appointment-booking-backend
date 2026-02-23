const express  = require('express');
const router   = express.Router();

const ctrl     = require('../controllers/slotController');
const validate = require('../middleware/validate');
const { writeLimiter, bookingLimiter } = require('../middleware/rateLimiter');

const {
  createSlotSchema,
  bulkSlotsSchema,
  updateSlotSchema,
  dateQuerySchema,
  rangeQuerySchema,
  availabilityQuerySchema,
  idParamSchema,
  bookSlotSchema,
} = require('../config/schemas');

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: Specific literal paths MUST come before parameterised /:id routes
// to prevent Express matching "range" or "bulk" as a UUID.
// ─────────────────────────────────────────────────────────────────────────────

// ── Read routes ───────────────────────────────────────────────────────────────

/** GET /api/slots?date=YYYY-MM-DD */
router.get('/',
  validate({ query: dateQuerySchema }),
  ctrl.getSlotsByDate,
);

/** GET /api/slots/range?startDate=&endDate= */
router.get('/range',
  validate({ query: rangeQuerySchema }),
  ctrl.getSlotsByRange,
);

/** GET /api/slots/availability?year=&month= */
router.get('/availability',
  validate({ query: availabilityQuerySchema }),
  ctrl.getMonthAvailability,
);

/** GET /api/slots/:id */
router.get('/:id',
  validate({ params: idParamSchema }),
  ctrl.getSlotById,
);

// ── Write routes ──────────────────────────────────────────────────────────────

/** POST /api/slots — create a single slot */
router.post('/',
  writeLimiter,
  validate({ body: createSlotSchema }),
  ctrl.createSlot,
);

/** POST /api/slots/bulk — create up to 100 slots at once */
router.post('/bulk',
  writeLimiter,
  validate({ body: bulkSlotsSchema }),
  ctrl.createBulkSlots,
);

/** PUT /api/slots/:id — partial update (whitelisted fields only) */
router.put('/:id',
  writeLimiter,
  validate({ params: idParamSchema, body: updateSlotSchema }),
  ctrl.updateSlot,
);

/** DELETE /api/slots/:id */
router.delete('/:id',
  writeLimiter,
  validate({ params: idParamSchema }),
  ctrl.deleteSlot,
);

/** POST /api/slots/:id/book — book a specific slot */
router.post('/:id/book',
  bookingLimiter,
  validate({ params: idParamSchema, body: bookSlotSchema }),
  ctrl.bookSlot,
);

// ── Method-not-allowed safety net ─────────────────────────────────────────────
const notAllowed = (req, res) =>
  res.status(405).json({
    success: false,
    code:    'METHOD_NOT_ALLOWED',
    message: `Method ${req.method} is not supported on ${req.path}`,
  });

router.all('/range',       notAllowed);
router.all('/availability', notAllowed);
router.all('/bulk',        notAllowed);
router.all('/:id/book',    notAllowed);

module.exports = router;
