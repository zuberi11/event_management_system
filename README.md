# EventFlow — Event Management System

An asynchronous, full-stack event scheduling and ticket booking reservation system built using Node.js, Express, and a relational SQLite database layer. The system manages event inventory and attendee registrations while preventing overbooking and replacing manual tracking with an efficient digital coordination tool.

---

## 👥 Project Team & Contribution Matrix

**Group Number: 3**

| Member Name | Roll Number | Primary Core Contributions |
| :--- | :--- | :--- |
| **Awais Khaliq** | `p229384` | **Database Architecture & Core Configurations**<br>• Initialized the SQLite relational schema design.<br>• Enforced table constraints, primary keys, and foreign key rules.<br>• Configured the server runtime frameworks (`package.json`) and session storage. |
| **Muhammad Ahmad Waheed** | `p229031` | **Backend Controller Layer & Secure SQL Queries**<br>• Programmed the foundational routing endpoints (`auth.js`, `bookings.js`, `events.js`).<br>• Authored secure, parameterized relational SQL transaction queries.<br>• Protected the application database layer from SQL injection threats. |
| **M Aqsam** | `p229359` | **Frontend Integration, UI Mapping & Query Optimization**<br>• Built the client dashboard UI, interactive form handlers, and admin workspace.<br>• Mapped backend database JSON response arrays dynamically into responsive views.<br>• Debugged and refactored backend event-filtering logic queries for edge-case stability. |

---

## 🔗 Project Repository

- **GitHub Repository URL:** [https://github.com/zuberi11/event_management_system](https://github.com/zuberi11/event_management_system)

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Database Engine** | SQLite via `better-sqlite3` |
| **Server Runtime** | Node.js v24 |
| **Web Framework** | Express.js |
| **Frontend** | Vanilla JavaScript (Fetch API), HTML5, CSS3 |
| **Authentication** | `bcryptjs` password hashing, `express-session` |
| **Security** | Parameterized Queries, Session Middleware |
| **Dev Tool** | Nodemon |

---

## ✅ Key Features

- **Event Scheduling** — Admins can create, update, and delete events with full details
- **Real-time Ticket Booking** — Attendees can browse and book tickets instantly
- **Overbooking Prevention** — Ticket availability is calculated live from the database before every booking
- **User Authentication** — Secure register and login with hashed passwords and session management
- **Transaction Tracking** — Every booking generates a linked payment record
- **Role-based Access** — Admin dashboard and attendee page with protected routes
- **Full CRUD Operations** — Implemented across events, bookings, and user management

---

## 🗄️ Database Schema

Four relational tables with enforced foreign keys:

```
users      → id, name, email, password, role, created_at
events     → id, title, description, date, venue, total_tickets, price, created_by, created_at
bookings   → id, user_id, event_id, tickets_booked, status, booked_at
payments   → id, booking_id, amount, status, paid_at
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/zuberi11/event_management_system.git
cd event_management_system
```

### Step 2 — Install Dependencies

```bash
npm install
```

### Step 3 — Initialize the Database

```bash
node db.js
```

This will automatically:
- Create the `database/eventflow.db` SQLite file
- Create all four tables
- Seed a default admin account

```
Default Admin Credentials:
  Email    → admin@gmail.com
  password → admin123
```

### Step 4 — Start the Server

```bash
npm run dev
```

### Step 5 — Open in Browser

| Page | URL |
| :--- | :--- |
| Attendee Page | http://localhost:3000 |
| Admin Dashboard | http://localhost:3000/admin *(login as admin first from attendee page)* |

---

## 🔐 SQL Injection Protection

All database queries use **parameterized statements** via `better-sqlite3`. User input is never concatenated into SQL strings directly.

```js
// ✅ Safe — used throughout this project
db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);

// ❌ Vulnerable — never used in this project
db.prepare(`SELECT * FROM users WHERE email = '${email}'`);
```

---

## 📁 Project Structure

```
eventflow/
├── database/
│   └── eventflow.db          ← auto-generated on first run
├── routes/
│   ├── auth.js               ← register, login, logout
│   ├── events.js             ← full CRUD for events
│   └── bookings.js           ← book, view, cancel, delete
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   ├── index.html            ← attendee page
│   └── admin.html            ← admin dashboard
├── db.js                     ← database connection & table setup
├── server.js                 ← express server entry point
└── package.json
```
