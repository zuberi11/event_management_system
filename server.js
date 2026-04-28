const express        = require('express');
const session        = require('express-session');
const path           = require('path');

const db             = require('./db');

const authRoutes     = require('./routes/auth');
const eventRoutes    = require('./routes/events');
const bookingRoutes  = require('./routes/bookings');

// ─── Create Express app
const app  = express();
const PORT = 3000;

// ============================================
//  MIDDLEWARE
// ============================================

// Parse incoming JSON requests (for API calls)
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS) from /public folder
app.use(express.static(path.join(__dirname, 'public')));

// Session setup (for login/logout)
app.use(session({
  secret           : 'eventflow_secret_key',
  resave           : false,
  saveUninitialized: false,
  cookie           : { maxAge: 1000 * 60 * 60 * 24 }  // 1 day
}));

// ============================================
//  ROUTES
// ============================================

app.use('/auth',     authRoutes);
app.use('/events',   eventRoutes);
app.use('/bookings', bookingRoutes);

// ─── Root route → serve attendee homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Admin route → serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============================================
//  START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('============================================');
  console.log(`  EventFlow server running!`);
  console.log(`  Attendee Page → http://localhost:${PORT}`);
  console.log(`  Admin Page    → http://localhost:${PORT}/admin`);
  console.log('============================================');
});