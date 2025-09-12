const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;

// Initialize database - use in-memory for Vercel
const db = new Database(':memory:');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    location TEXT,
    branch_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    hours TEXT,
    latitude REAL,
    longitude REAL
  );
  
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    city TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    branch_id INTEGER,
    status TEXT DEFAULT 'pending',
    total_price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id),
    FOREIGN KEY (product_id) REFERENCES products (id),
    FOREIGN KEY (branch_id) REFERENCES branches (id)
  );
`);

// Insert sample branches for each city
const branchCount = db.prepare('SELECT COUNT(*) as count FROM branches').get();
if (branchCount.count === 0) {
  const insertBranch = db.prepare('INSERT INTO branches (city, name, address, phone, hours) VALUES (?, ?, ?, ?, ?)');
  
  // Kabul branches (10 branches)
  const kabulBranches = [
    ['Kabul', 'Kabul Central', 'Street 1, District 1', '+93 123 456 789', '8:00 AM - 10:00 PM'],
    ['Kabul', 'Kabul North', 'Street 2, District 2', '+93 123 456 790', '8:00 AM - 10:00 PM'],
    ['Kabul', 'Kabul South', 'Street 3, District 3', '+93 123 456 791', '8:00 AM - 10:00 PM'],
    ['Kabul', 'Kabul East', 'Street 4, District 4', '+93 123 456 792', '8:00 AM - 10:00 PM'],
    ['Kabul', 'Kabul West', 'Street 5, District 5', '+93 123 456 793', '8:00 AM - 10:00 PM'],
    ['Kabul', 'Kabul Commercial', 'Street 6, District 6', '+93 123 456 794', '8:00 AM - 10:00 PM'],
    ['Kabul', 'Kabul Market', 'Street 7, District 7', '+93 123 456 795', '8:00 AM - 10:00 PM'],
    ['Kabul', 'Kabul Downtown', 'Street 8, District 8', '+93 123 456 796', '8:00 AM - 10:00 PM'],
    ['Kabul', 'Kabul Residential', 'Street 9, District 9', '+93 123 456 797', '8:00 AM - 10:00 PM'],
    ['Kabul', 'Kabul Express', 'Street 10, District 10', '+93 123 456 798', '8:00 AM - 10:00 PM']
  ];
  
  // Add branches for other cities (similarly)
  const cities = ['Jalalabad', 'Kandahar', 'Herat', 'Balkh'];
  cities.forEach(city => {
    for (let i = 1; i <= 10; i++) {
      insertBranch.run(
        city,
        `${city} Branch ${i}`,
        `Main Street ${i}, ${city}`,
        `+93 123 456 ${700 + i}`,
        '8:00 AM - 10:00 PM'
      );
    }
  });
  
  kabulBranches.forEach(branch => {
    insertBranch.run(...branch);
  });
}

// Insert sample products if table is empty
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productCount.count === 0) {
  const insertProduct = db.prepare('INSERT INTO products (name, price, category, location, branch_id) VALUES (?, ?, ?, ?, ?)');
  
  const products = [
    ['Afghan Rug', 49.99, 'Home', 'Kabul', 1],
    ['Green Tea', 5.99, 'Grocery', 'Jalalabad', 11],
    ['Traditional Hat', 12.99, 'Wearing Stuff', 'Kandahar', 21],
    ['Handcrafted Jewelry', 24.99, 'Accessories', 'Herat', 31],
    ['Dried Fruits', 8.99, 'Grocery', 'Balkh', 41],
    ['Spices Collection', 15.99, 'Grocery', 'Kabul', 2],
    ['Wooden Crafts', 32.99, 'Home', 'Jalalabad', 12],
    ['Silk Scarves', 18.99, 'Wearing Stuff', 'Kandahar', 22],
    ['Copper Items', 27.99, 'Home', 'Herat', 32],
    ['Saffron', 29.99, 'Grocery', 'Balkh', 42]
  ];
  
  products.forEach(product => {
    insertProduct.run(...product);
  });
}

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Add CSP headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'");
  next();
});

// Serve favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// API routes
app.get('/api/products', (req, res) => {
  try {
    const { city, branch, category } = req.query;
    let query = 'SELECT * FROM products';
    let params = [];
    
    if (city || branch || category) {
      query += ' WHERE 1=1';
      if (city) {
        query += ' AND location = ?';
        params.push(city);
      }
      if (branch) {
        query += ' AND branch_id = ?';
        params.push(branch);
      }
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
    }
    
    const stmt = db.prepare(query);
    const products = stmt.all(...params);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/branches', (req, res) => {
  try {
    const { city } = req.query;
    let query = 'SELECT * FROM branches';
    let params = [];
    
    if (city) {
      query += ' WHERE city = ?';
      params.push(city);
    }
    
    const stmt = db.prepare(query);
    const branches = stmt.all(...params);
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { name, price, category, location, branch_id } = req.body;
    const stmt = db.prepare('INSERT INTO products (name, price, category, location, branch_id) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, price, category, location, branch_id);
    res.json({ id: info.lastInsertRowid, name, price, category, location, branch_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, email, phone, address, city } = req.body;
    const stmt = db.prepare('INSERT INTO customers (name, email, phone, address, city) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, email, phone, address, city);
    res.json({ id: info.lastInsertRowid, name, email, phone, address, city });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { customer_id, product_id, quantity, branch_id, total_price } = req.body;
    const stmt = db.prepare('INSERT INTO orders (customer_id, product_id, quantity, branch_id, total_price) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(customer_id, product_id, quantity, branch_id, total_price);
    res.json({ 
      id: info.lastInsertRowid, 
      customer_id, 
      product_id, 
      quantity, 
      branch_id, 
      total_price,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cities', (req, res) => {
  try {
    const stmt = db.prepare('SELECT DISTINCT city FROM branches ORDER BY city');
    const cities = stmt.all().map(row => row.city);
    res.json(cities);
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