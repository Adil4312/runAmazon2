const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;

// Initialize database - use in-memory for Vercel
const db = new Database(':memory:');

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
  insert.run('Traditional Hat', 12.99, 'Wearing Stuff', 'Kandahar');
  insert.run('Handcrafted Jewelry', 24.99, 'Accessories', 'Herat');
  insert.run('Dried Fruits', 8.99, 'Grocery', 'Balkh');
}

// Middleware
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// API routes
app.get('/api/products', (req, res) => {
  const stmt = db.prepare('SELECT * FROM products');
  const products = stmt.all();
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const { name, price, category, location } = req.body;
  const stmt = db.prepare('INSERT INTO products (name, price, category, location) VALUES (?, ?, ?, ?)');
  const info = stmt.run(name, price, category, location);
  res.json({ id: info.lastInsertRowid, name, price, category, location });
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for Vercel serverless
module.exports = app;