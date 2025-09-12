const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afghan-amazon';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB Atlas successfully!');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  // Fallback to SQLite if MongoDB fails
  console.log('Falling back to SQLite database...');
});

// MongoDB Schemas
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String },
  images: [{ type: String }],
  location: { type: String, required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  manager: { type: String },
  hours: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  services: [{ type: String }]
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const Branch = mongoose.model('Branch', BranchSchema);

// Keep your existing SQLite code as fallback
const Database = require('better-sqlite3');
const sqliteDB = new Database(':memory:');
sqliteDB.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    location TEXT,
    branch_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);