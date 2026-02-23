const slotModel = require('../models/slotModel');
const logger = require('../config/logger');

/**
 * All controllers assume:
 *  - Joi middleware has already validated + sanitised req.query / req.params / req.body
 *  - Errors are forwarded to the centralised error handler via next(err)
 */

// ─── GET /api/slots?date=YYYY-MM-DD ──────────────────────────────────────────
const getSlotsByDate = async (req, res, next) => {
    try {
        const { date } = req.query;
        const slots = await slotModel.getSlotsByDate(date);
        return res.status(200).json({
            success: true,
            date,
            count: slots.length,
            data: slots,
        });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/slots/range?startDate=&endDate= ────────────────────────────────
const getSlotsByRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const slots = await slotModel.getSlotsByDateRange(startDate, endDate);
        return res.status(200).json({
            success: true,
            startDate,
            endDate,
            count: slots.length,
            data: slots,
        });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/slots/availability?year=&month= ────────────────────────────────
const getMonthAvailability = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        const availability = await slotModel.getMonthAvailability(Number(year), Number(month));
        return res.status(200).json({
            success: true,
            year: Number(year),
            month: Number(month),
            data: availability,
        });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/slots/:id ───────────────────────────────────────────────────────
const getSlotById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const slot = await slotModel.getSlotById(id);
        return res.status(200).json({ success: true, data: slot });
    } catch (err) {
        next(err);
    }
};

// ─── POST /api/slots ──────────────────────────────────────────────────────────
const createSlot = async (req, res, next) => {
    try {
        const slot = await slotModel.createSlot(req.body);
        logger.info('Slot created', { slotId: slot.id, date: slot.date });
        return res.status(201).json({
            success: true,
            message: 'Time slot created successfully',
            data: slot,
        });
    } catch (err) {
        next(err);
    }
};

// ─── POST /api/slots/bulk ─────────────────────────────────────────────────────
const createBulkSlots = async (req, res, next) => {
    try {
        const { slots } = req.body;
        const data = await slotModel.createBulkSlots(slots);
        logger.info('Bulk slots created', { count: data.length });
        return res.status(201).json({
            success: true,
            message: `${data.length} time slot(s) created successfully`,
            data,
        });
    } catch (err) {
        next(err);
    }
};

// ─── PUT /api/slots/:id ───────────────────────────────────────────────────────
const updateSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const slot = await slotModel.updateSlot(id, req.body);
        logger.info('Slot updated', { slotId: id });
        return res.status(200).json({
            success: true,
            message: 'Time slot updated successfully',
            data: slot,
        });
    } catch (err) {
        next(err);
    }
};

// ─── DELETE /api/slots/:id ────────────────────────────────────────────────────
const deleteSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        await slotModel.deleteSlot(id);
        logger.info('Slot deleted', { slotId: id });
        return res.status(200).json({
            success: true,
            message: 'Time slot deleted successfully',
        });
    } catch (err) {
        next(err);
    }
};

// ─── POST /api/slots/:id/book ─────────────────────────────────────────────────
const bookSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await slotModel.bookSlot(id, req.body);
        logger.info('Slot booked', { slotId: id, client: req.body.client_email });
        return res.status(201).json({
            success: true,
            message: 'Appointment booked successfully!',
            data: booking,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getSlotsByDate,
    getSlotsByRange,
    getMonthAvailability,
    getSlotById,
    createSlot,
    createBulkSlots,
    updateSlot,
    deleteSlot,
    bookSlot,
};
