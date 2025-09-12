require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/afghan-amazon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
  avatar: { type: String },
  preferences: {
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
    notifications: { type: Boolean, default: true }
  }
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    notes: { type: String }
  },
  payment: {
    method: { type: String, enum: ['cash', 'card', 'bank'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    transactionId: { type: String }
  }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const Branch = mongoose.model('Branch', BranchSchema);
const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'client/build')));

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-branch', (branchId) => {
    socket.join(`branch-${branchId}`);
  });
  
  socket.on('new-order', (orderData) => {
    socket.to(`branch-${orderData.branch}`).emit('order-notification', orderData);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});x