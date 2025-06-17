const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { scheduleDonationInitialization } = require('./utils/cronJobs');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Connect to MongoDB
connectDB();

// Initialize cron jobs
scheduleDonationInitialization();

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Routes
const authRoutes = require('./routes/auth.routes');
const donorRoutes = require('./routes/donor.routes');
const donationRoutes = require('./routes/donation.routes');
const groupRoutes = require('./routes/group.routes');

app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/groups', groupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});