// ============================================
//  routes/events.js — Event CRUD Routes
//  EventFlow Project
// ============================================

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

// ============================================
//  CREATE — POST /events
//  Admin creates a new event
// ============================================

router.post('/', isAdmin, (req, res) => {

  const { title, description, date, venue, total_tickets, price } = req.body;

  // ─── Validation
  if (!title || !date || !venue || !total_tickets) {
    return res.status(400).json({ error: 'Title, date, venue and total_tickets are required.' });
  }

  if (isNaN(total_tickets) || total_tickets <= 0) {
    return res.status(400).json({ error: 'total_tickets must be a positive number.' });
  }

  // ─── Insert event (PARAMETERIZED QUERY → SQL Injection safe)
  const result = db.prepare(`
    INSERT INTO events (title, description, date, venue, total_tickets, price, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || '',
    date,
    venue,
    total_tickets,
    price || 0,
    req.session.user.id
  );

  return res.status(201).json({
    message  : 'Event created successfully.',
    event_id : result.lastInsertRowid
  });

});

// ============================================
//  READ ALL — GET /events
//  Anyone can view all events with tickets left
// ============================================

router.get('/', (req, res) => {

  // ─── Calculate tickets_sold and tickets_remaining using subquery
  const events = db.prepare(`
    SELECT
      e.id,
      e.title,
      e.description,
      e.date,
      e.venue,
      e.total_tickets,
      e.price,
      e.created_at,
      COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.tickets_booked ELSE 0 END), 0) AS tickets_sold,
      e.total_tickets - COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.tickets_booked ELSE 0 END), 0) AS tickets_remaining
    FROM events e
    LEFT JOIN bookings b ON e.id = b.event_id
    GROUP BY e.id
    ORDER BY e.date ASC
  `).all();

  return res.status(200).json({ events });

});

// ============================================
//  READ ONE — GET /events/:id
//  Get single event details
// ============================================

router.get('/:id', (req, res) => {

  const event = db.prepare(`
    SELECT
      e.*,
      COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.tickets_booked ELSE 0 END), 0) AS tickets_sold,
      e.total_tickets - COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.tickets_booked ELSE 0 END), 0) AS tickets_remaining
    FROM events e
    LEFT JOIN bookings b ON e.id = b.event_id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(req.params.id);

  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  return res.status(200).json({ event });

});

// ============================================
//  UPDATE — PUT /events/:id
//  Admin updates an event
// ============================================

router.put('/:id', isAdmin, (req, res) => {

  const { title, description, date, venue, total_tickets, price } = req.body;

  // ─── Check event exists
  const event = db.prepare(`SELECT id FROM events WHERE id = ?`).get(req.params.id);

  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  // ─── Update event (PARAMETERIZED QUERY → SQL Injection safe)
  db.prepare(`
    UPDATE events
    SET title = ?, description = ?, date = ?, venue = ?, total_tickets = ?, price = ?
    WHERE id = ?
  `).run(
    title,
    description || '',
    date,
    venue,
    total_tickets,
    price || 0,
    req.params.id
  );

  return res.status(200).json({ message: 'Event updated successfully.' });

});

// ============================================
//  DELETE — DELETE /events/:id
//  Admin deletes an event
// ============================================

router.delete('/:id', isAdmin, (req, res) => {

  // ─── Check event exists
  const event = db.prepare(`SELECT id FROM events WHERE id = ?`).get(req.params.id);

  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  // ─── Delete event (PARAMETERIZED QUERY → SQL Injection safe)
  db.prepare(`DELETE FROM events WHERE id = ?`).run(req.params.id);

  return res.status(200).json({ message: 'Event deleted successfully.' });

});

module.exports = router;