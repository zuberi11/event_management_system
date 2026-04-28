const Database = require('better-sqlite3');
const path     = require('path');

const db = new Database(path.join(__dirname, 'database', 'eventflow.db'));

// ─── Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');


db.exec(`

  -- TABLE 1: Users (Admins + Attendees)
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'attendee' CHECK(role IN ('admin', 'attendee')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- TABLE 2: Events (created by admins)
  CREATE TABLE IF NOT EXISTS events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    description   TEXT,
    date          TEXT    NOT NULL,
    venue         TEXT    NOT NULL,
    total_tickets INTEGER NOT NULL CHECK(total_tickets > 0),
    price         REAL    NOT NULL DEFAULT 0,
    created_by    INTEGER NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  -- TABLE 3: Bookings (attendee books an event)
  CREATE TABLE IF NOT EXISTS bookings (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    event_id       INTEGER NOT NULL,
    tickets_booked INTEGER NOT NULL CHECK(tickets_booked > 0),
    status         TEXT    NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled')),
    booked_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id)  REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  -- TABLE 4: Payments (one payment per booking)
  CREATE TABLE IF NOT EXISTS payments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    amount     REAL    NOT NULL,
    status     TEXT    NOT NULL DEFAULT 'paid' CHECK(status IN ('paid', 'refunded')),
    paid_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  );

`);



const bcrypt = require('bcryptjs');

const adminExists = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();

if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, 'admin')
  `).run('Admin', 'admin@gmail.com', hashedPassword);

  console.log(' Default admin created');
}


module.exports = db;