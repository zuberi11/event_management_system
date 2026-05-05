const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');

const router  = express.Router();

// ============================================
//  POST /auth/register — Create new attendee
// ============================================

router.post('/register', (req, res) => {

  const { name, email, password } = req.body;

  // ─── Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  // ─── Check if email already exists
  // PARAMETERIZED QUERY → safe from SQL Injection
  const existing = db.prepare(`
    SELECT id FROM users WHERE email = ?
  `).get(email);

  if (existing) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  // ─── Hash password before saving
  const hashedPassword = bcrypt.hashSync(password, 10);

  // ─── Insert new user (PARAMETERIZED QUERY)
  const result = db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, 'attendee')
  `).run(name, email, hashedPassword);

  return res.status(201).json({
    message : 'Registration successful.',
    user_id : result.lastInsertRowid
  });

});

// ============================================
//  POST /auth/login — Login user
// ============================================

router.post('/login', (req, res) => {

  const { email, password } = req.body;

  // ─── Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // ─── Find user by email (PARAMETERIZED QUERY)
  const user = db.prepare(`
    SELECT * FROM users WHERE email = ?
  `).get(email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // ─── Compare hashed password
  const passwordMatch = bcrypt.compareSync(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // ─── Save user info in session
  req.session.user = {
    id   : user.id,
    name : user.name,
    email: user.email,
    role : user.role
  };

  return res.status(200).json({
    message: 'Login successful.',
    user: {
      id   : user.id,
      name : user.name,
      email: user.email,
      role : user.role
    }
  });

});

// ============================================
//  POST /auth/logout — Logout user
// ============================================

router.post('/logout', (req, res) => {

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed.' });
    }
    return res.status(200).json({ message: 'Logged out successfully.' });
  });

});

// ============================================
//  GET /auth/me — Check who is logged in
// ============================================

router.get('/me', (req, res) => {

  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in.' });
  }

  return res.status(200).json({ user: req.session.user });

});

module.exports = router;