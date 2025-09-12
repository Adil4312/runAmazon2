const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;

// Initialize database - use in-memory for Vercel
const db = new Database(':memory:');
// Add CSP headers to prevent eval() errors
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'");
  next();
});

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    location TEXT
  )
`);

// Insert sample data if table is empty
const rowCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (rowCount.count === 0) {
  const insert = db.prepare('INSERT INTO products (name, price, category, location) VALUES (?, ?, ?, ?)');
  insert.run('Afghan Rug', 49.99, 'Home', 'Kabul');
  insert.run('Green Tea', 5.99, 'Grocery', 'Jalalabad');
}

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// API routes
app.get('/api/products', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM products');
    const products = stmt.all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { name, price, category, location } = req.body;
    const stmt = db.prepare('INSERT INTO products (name, price, category, location) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, price, category, location);
    res.json({ id: info.lastInsertRowid, name, price, category, location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Vercel serverless
module.exports = app;