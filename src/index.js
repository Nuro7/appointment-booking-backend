require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Routes
const slotRoutes = require('./routes/slotRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://appointment-booking-frontend-flax.vercel.app'
];

const allowedOrigins = [
    ...defaultOrigins,
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [])
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., Postman, curl)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is in the allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // In development, allow any localhost port
        const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
        if ((process.env.NODE_ENV || 'development') === 'development' && isLocalhost) {
            return callback(null, true);
        }

        callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'Appointment Booking API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/slots', slotRoutes);

// ─── Root Route ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({
        message: '📅 Appointment Booking API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            slots: {
                'GET /api/slots?date=YYYY-MM-DD': 'Get time slots for a specific date',
                'GET /api/slots/range?startDate=&endDate=': 'Get time slots in a date range',
                'GET /api/slots/availability?year=&month=': 'Get monthly availability summary',
                'GET /api/slots/:id': 'Get a specific time slot',
                'POST /api/slots': 'Create a new time slot',
                'POST /api/slots/bulk': 'Create multiple time slots',
                'PUT /api/slots/:id': 'Update a time slot',
                'DELETE /api/slots/:id': 'Delete a time slot',
                'POST /api/slots/:id/book': 'Book a time slot',
            },
        },
    });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log(`║  📅 Appointment Booking API               ║`);
    console.log(`║  🚀 Server running on port ${PORT}           ║`);
    console.log(`║  🌐 https://appointment-booking-backend-ccgq.onrender.com ║`);
    // console.log(`║  🌐 http://localhost:${PORT}                ║`);
    console.log(`║  📊 Environment: ${(process.env.NODE_ENV || 'development').padEnd(22)}║`);
    console.log('╚══════════════════════════════════════════╝\n');
});

module.exports = app;
