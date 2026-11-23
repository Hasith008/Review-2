require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors'); // <--- Required to allow frontend requests from port 5173
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const { MONGODB_URI, JWT_SECRET, PORT = 5000 } = process.env;
if (!MONGODB_URI || !JWT_SECRET) {
  console.error('Missing MONGODB_URI or JWT_SECRET. Create server/.env from .env.example');
  process.exit(1);
}

const app = express();

// Security and Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors()); // <--- Enables CORS for all origins (or you can restrict to http://localhost:5173)
app.use(express.json({ limit: '10kb' }));

// Rate limiting for auth routes
app.use('/api/auth', rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  message: { message: 'Too many attempts. Try again later.' } 
}));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));

// Root Fallback Route
app.get('/', (req, res) => {
  res.send('Expense Tracker API is running successfully!');
});

// Serve static client files if available
app.use(express.static(path.join(__dirname, '..', 'client'))); 

// 404 handler for API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid request.' });
  if (err.code === 11000) return res.status(409).json({ message: 'Email already exists! Please use another email.' });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// Seed Initial Admin Account
async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase();
  if (await User.findOne({ email })) return;
  await User.create({ 
    name: 'Admin', 
    email, 
    role: 'admin', 
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10) 
  });
  console.log('Admin account created:', email);
}

// Connect to MongoDB and Start Server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Atlas connected');
    await seedAdmin();
    app.listen(PORT, () => console.log(`Server running on port ${PORT} -> Open http://localhost:${PORT}`));
  })
  .catch(err => { 
    console.error('MongoDB connection failed:', err.message); 
    process.exit(1); 
  });