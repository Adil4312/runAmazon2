const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    description TEXT,
    images TEXT,
    location TEXT,
    branch_id INTEGER,
    stock INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    manager TEXT,
    hours TEXT,
    lat REAL,
    lng REAL,
    services TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    role TEXT DEFAULT 'customer',
    avatar TEXT,
    preferences TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    items TEXT,
    total REAL,
    status TEXT DEFAULT 'pending',
    shipping_address TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    user_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert sample data
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productCount.count === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (name, price, category, description, location, branch_id, stock, featured, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['Afghan Rug', 49.99, 'Home', 'Beautiful handmade Afghan rug', 'Kabul', 1, 15, 1, 4.5],
    ['Green Tea', 5.99, 'Grocery', 'Premium Afghan green tea', 'Jalalabad', 2, 100, 0, 4.2],
    ['Traditional Hat', 12.99, 'Clothing', 'Authentic Afghan hat', 'Kandahar', 3, 25, 1, 4.7],
    ['Handcrafted Jewelry', 24.99, 'Accessories', 'Silver Afghan jewelry', 'Herat', 4, 30, 1, 4.8],
    ['Dried Fruits', 8.99, 'Grocery', 'Organic dried fruits', 'Balkh', 5, 80, 0, 4.3],
    ['Spices Collection', 15.99, 'Grocery', 'Authentic Afghan spices', 'Kabul', 1, 50, 1, 4.6],
    ['Wooden Crafts', 32.99, 'Home', 'Hand-carved wooden items', 'Jalalabad', 2, 20, 0, 4.4],
    ['Silk Scarves', 18.99, 'Clothing', 'Luxury silk scarves', 'Kandahar', 3, 35, 1, 4.9],
    ['Copper Items', 27.99, 'Home', 'Traditional copperware', 'Herat', 4, 15, 1, 4.5],
    ['Saffron', 29.99, 'Grocery', 'Premium Afghan saffron', 'Balkh', 5, 40, 1, 4.7]
  ];

  products.forEach(product => {
    insertProduct.run(...product);
  });
}

const branchCount = db.prepare('SELECT COUNT(*) as count FROM branches').get();
if (branchCount.count === 0) {
  const insertBranch = db.prepare(`
    INSERT INTO branches (name, city, address, phone, hours)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Kabul branches
  const kabulBranches = [
    ['Kabul Central', 'Kabul', 'Street 1, District 1', '+93 123 456 789', '8:00 AM - 10:00 PM'],
    ['Kabul North', 'Kabul', 'Street 2, District 2', '+93 123 456 790', '8:00 AM - 10:00 PM'],
    ['Kabul South', 'Kabul', 'Street 3, District 3', '+93 123 456 791', '8:00 AM - 10:00 PM']
  ];

  // Other cities branches
  const cities = ['Jalalabad', 'Kandahar', 'Herat', 'Balkh'];
  cities.forEach(city => {
    for (let i = 1; i <= 3; i++) {
      insertBranch.run(
        `${city} Branch ${i}`,
        city,
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

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-branch', (branchId) => {
    socket.join(`branch-${branchId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API Routes

// Get all products
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

// Get product by ID
app.get('/api/products/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const product = stmt.get(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new product
app.post('/api/products', (req, res) => {
  try {
    const { name, price, category, description, location, branch_id, stock } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO products (name, price, category, description, location, branch_id, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, price, category, description, location, branch_id, stock);
    
    res.json({
      id: result.lastInsertRowid,
      name,
      price,
      category,
      description,
      location,
      branch_id,
      stock
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all branches
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

// Get cities
app.get('/api/cities', (req, res) => {
  try {
    const stmt = db.prepare('SELECT DISTINCT city FROM branches ORDER BY city');
    const cities = stmt.all().map(row => row.city);
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User registration
app.post('/api/register', (req, res) => {
  try {
    const { name, email, password, phone, address, city } = req.body;
    
    const checkStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const existingUser = checkStmt.get(email);
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, phone, address, city)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, email, password, phone, address, city);
    
    res.json({
      id: result.lastInsertRowid,
      name,
      email,
      phone,
      address,
      city
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
app.post('/api/orders', (req, res) => {
  try {
    const { customer_id, items, total, shipping_address, payment_method } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO orders (customer_id, items, total, shipping_address, payment_method)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(customer_id, JSON.stringify(items), total, JSON.stringify(shipping_address), payment_method);
    
    // Notify relevant branch about new order
    if (items.length > 0 && items[0].branch_id) {
      io.to(`branch-${items[0].branch_id}`).emit('new-order', {
        orderId: result.lastInsertRowid,
        items,
        total
      });
    }
    
    res.json({
      id: result.lastInsertRowid,
      customer_id,
      items,
      total,
      shipping_address,
      payment_method,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    message: 'Server is running successfully with SQLite database'
  });
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/pashto.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pashto.html'));
});

// Serve favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using SQLite database (in-memory)`);
});

module.exports = app;