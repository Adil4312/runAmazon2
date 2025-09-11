const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;

// Initialize database - use in-memory for Vercel or provide persistent solution
const db = new Database(process.env.DB_PATH || ':memory:');

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
}

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/pashto.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pashto.html'));
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

// Export for Vercel serverless
module.exports = app;