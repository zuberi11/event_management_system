const express = require('express');
const db      = require('../db');

const router  = express.Router();

// ============================================
//  MIDDLEWARE — Check if user is logged in
// ============================================

function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please login first.' });
  }
  next();
}

// ============================================
//  MIDDLEWARE — Check if user is admin
// ============================================

function isAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

//  CREATE — POST /bookings
//  Attendee books tickets for an event

router.post('/', isLoggedIn, (req, res) => {

  const { event_id, tickets_booked } = req.body;
  const user_id = req.session.user.id;

  // ─── Validation
  if (!event_id || !tickets_booked) {
    return res.status(400).json({ error: 'event_id and tickets_booked are required.' });
  }

  if (isNaN(tickets_booked) || tickets_booked <= 0) {
    return res.status(400).json({ error: 'tickets_booked must be a positive number.' });
  }

  // ─── Check event exists (PARAMETERIZED QUERY)
  const event = db.prepare(`SELECT * FROM events WHERE id = ?`).get(event_id);

  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  // ─── Calculate tickets remaining (OVERBOOKING PREVENTION)
  const soldRow = db.prepare(`
    SELECT COALESCE(SUM(tickets_booked), 0) AS tickets_sold
    FROM bookings
    WHERE event_id = ? AND status = 'confirmed'
  `).get(event_id);

  const tickets_remaining = event.total_tickets - soldRow.tickets_sold;

  if (tickets_booked > tickets_remaining) {
    return res.status(400).json({
      error             : 'Not enough tickets available.',
      tickets_remaining : tickets_remaining
    });
  }

  // ─── Insert booking (PARAMETERIZED QUERY → SQL Injection safe)
  const booking = db.prepare(`
    INSERT INTO bookings (user_id, event_id, tickets_booked, status)
    VALUES (?, ?, ?, 'confirmed')
  `).run(user_id, event_id, tickets_booked);

  // ─── Insert payment record
  const amount = event.price * tickets_booked;

  db.prepare(`
    INSERT INTO payments (booking_id, amount, status)
    VALUES (?, ?, 'paid')
  `).run(booking.lastInsertRowid, amount);

  return res.status(201).json({
    message    : 'Booking confirmed.',
    booking_id : booking.lastInsertRowid,
    amount_paid: amount
  });

});

// ============================================
//  READ — GET /bookings/my
//  Logged in attendee sees their own bookings
// ============================================

router.get('/my', isLoggedIn, (req, res) => {

  const bookings = db.prepare(`
    SELECT
      b.id         AS booking_id,
      b.tickets_booked,
      b.status,
      b.booked_at,
      e.title      AS event_title,
      e.date       AS event_date,
      e.venue      AS event_venue,
      p.amount     AS amount_paid,
      p.status     AS payment_status
    FROM bookings b
    JOIN events   e ON b.event_id   = e.id
    JOIN payments p ON p.booking_id = b.id
    WHERE b.user_id = ?
    ORDER BY b.booked_at DESC
  `).all(req.session.user.id);

  return res.status(200).json({ bookings });

});

// ============================================
//  READ — GET /bookings/all
//  Admin sees ALL bookings across all events
// ============================================

router.get('/all', isAdmin, (req, res) => {

  const bookings = db.prepare(`
    SELECT
      b.id             AS booking_id,
      b.tickets_booked,
      b.status,
      b.booked_at,
      u.name           AS attendee_name,
      u.email          AS attendee_email,
      e.title          AS event_title,
      e.date           AS event_date,
      e.venue          AS event_venue,
      p.amount         AS amount_paid,
      p.status         AS payment_status
    FROM bookings b
    JOIN users    u ON b.user_id    = u.id
    JOIN events   e ON b.event_id   = e.id
    JOIN payments p ON p.booking_id = b.id
    ORDER BY b.booked_at DESC
  `).all();

  return res.status(200).json({ bookings });

});

// ============================================
//  UPDATE — PUT /bookings/:id/cancel
//  Attendee cancels their own booking
// ============================================

router.put('/:id/cancel', isLoggedIn, (req, res) => {

  const user_id    = req.session.user.id;
  const booking_id = req.params.id;

  // ─── Find booking and make sure it belongs to this user
  const booking = db.prepare(`
    SELECT * FROM bookings WHERE id = ? AND user_id = ?
  `).get(booking_id, user_id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ error: 'Booking is already cancelled.' });
  }

  // ─── Cancel booking (PARAMETERIZED QUERY)
  db.prepare(`
    UPDATE bookings SET status = 'cancelled' WHERE id = ?
  `).run(booking_id);

  // ─── Mark payment as refunded
  db.prepare(`
    UPDATE payments SET status = 'refunded' WHERE booking_id = ?
  `).run(booking_id);

  return res.status(200).json({ message: 'Booking cancelled and payment refunded.' });

});

// ============================================
//  DELETE — DELETE /bookings/:id
//  Admin hard deletes a booking record
// ============================================

router.delete('/:id', isAdmin, (req, res) => {

  const booking = db.prepare(`SELECT id FROM bookings WHERE id = ?`).get(req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // ─── Delete payment first (foreign key), then booking
  db.prepare(`DELETE FROM payments WHERE booking_id = ?`).run(req.params.id);
  db.prepare(`DELETE FROM bookings WHERE id = ?`).run(req.params.id);

  return res.status(200).json({ message: 'Booking deleted successfully.' });

});

module.exports = router;