const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ── Route file imports ────────────────────────
const tourRoutes = require('./routes/tours');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
// MIDDLEWARE STACK
// Order matters — these run top to bottom on
// every request before it hits a route handler
// ─────────────────────────────────────────────

// Allow requests from your React frontend (port 3000 in dev)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-user-role']  // x-user-role must be explicitly allowed
}));

// Parse incoming JSON request bodies
app.use(express.json());

// ─────────────────────────────────────────────
// DATABASE CONNECTION
// ─────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🚀 Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));
mongoose.set('debug', true);  
// ^ Enables Mongoose debug mode to log all queries in the terminal while running

// Log mongoose connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected.');
});

// Log mongoose connection events after initial connect
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Reconnecting...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected.');
});

// ─────────────────────────────────────────────
// ROUTE MOUNTING
// Every route defined in tours.js is now reachable
// under /api/tours, and every route in admin.js
// is reachable under /api/admin
// ─────────────────────────────────────────────
app.use('/api/tours', tourRoutes);
app.use('/api/admin', adminRoutes);

// ─────────────────────────────────────────────
// HEALTH CHECK ROUTE
// Hit GET /api/health to confirm the server is
// alive without touching the database
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ECHO API is running.',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────
// 404 HANDLER
// Catches any request that didn't match a route above.
// Must be placed AFTER all route definitions.
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Catches any error passed via next(error) from
// any route or middleware above it.
// Must be the very last app.use() call.
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('!!! Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.'
  });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`📡 ECHO API listening on port ${PORT}`);
  console.log(`   Health check → http://localhost:${PORT}/api/health`);
  console.log(`   Tours        → http://localhost:${PORT}/api/tours`);
  console.log(`   Admin        → http://localhost:${PORT}/api/admin/analytics`);
});