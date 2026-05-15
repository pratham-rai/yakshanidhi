require('dotenv').config(); // Trigger build v2
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const uploadRoutes = require('./routes/upload');
const { auth } = require('./middleware/auth');
const User = require('./models/User');
const Event = require('./models/Event');
const { startScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/upload', auth, uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve static files from the frontend
const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));

// SPA Fallback: Serve index.html for any non-API routes
app.get('*any', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Seed demo data if empty
    await seedData();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      startScheduler();
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.error('   Make sure MONGODB_URI is set correctly in .env');
    process.exit(1);
  }
}

async function seedData() {
  // Create master admin if no users exist
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({
      email: 'master@yakshanidhi.com',
      password: hashed,
      displayName: 'Master Admin',
      role: 'masterAdmin',
    });
    await User.updateMany({ isVerified: { $exists: false } }, { isVerified: true });
    console.log('✅ Created master admin: master@yakshanidhi.com / admin123');
  } else {
    // Also verify any existing users who don't have the field yet
    await User.updateMany({ isVerified: { $exists: false } }, { isVerified: true });
  }

  // Seed events if empty
  const eventCount = await Event.countDocuments();
  if (eventCount === 0) {
    const demoEvents = [
      {
        prasanga: 'Karna Parva', troupe: 'Dharmasthala Mela', thittu: 'Thenku',
        date: '2026-05-20', time: '20:00', location: 'Dharmasthala Temple, Dharmasthala',
        googleMapsLink: 'https://maps.google.com/?q=12.9563,75.3724',
        latitude: 12.9563, longitude: 75.3724,
        description: "A grand performance of Karna Parva by the renowned Dharmasthala Mela.",
        posterUrls: [], status: 'approved', submittedByName: 'YakshaNidhi',
      },
      {
        prasanga: 'Panchavati', troupe: 'Kateel Mela', thittu: 'Thenku',
        date: '2026-05-22', time: '20:30', location: 'Kateel Durgaparameshwari Temple, Kateel',
        latitude: 12.9170, longitude: 74.9177,
        description: 'The beautiful tale of Rama and Sita in Panchavati forest.',
        posterUrls: [], status: 'approved', submittedByName: 'YakshaNidhi',
      },
      {
        prasanga: 'Draupadi Vastrapaharana', troupe: 'Mandarthi Mela', thittu: 'Badagu',
        date: '2026-05-25', time: '19:30', location: 'Udupi Sri Krishna Matha, Udupi',
        latitude: 13.3353, longitude: 74.7461,
        description: "The dramatic episode of Draupadi's humiliation in the Kaurava court.",
        posterUrls: [], status: 'approved', submittedByName: 'YakshaNidhi',
      },
      {
        prasanga: 'Bhishma Vijaya', troupe: 'Saligrama Mela', thittu: 'Bada-Badagu',
        date: '2026-05-28', time: '20:00', location: 'Town Hall, Kundapura',
        latitude: 13.6236, longitude: 74.6940,
        description: 'An all-night Yakshagana performance depicting the glory of Bhishma.',
        posterUrls: [], status: 'approved', submittedByName: 'YakshaNidhi',
      },
      {
        prasanga: 'Shri Devi Mahatme', troupe: 'Perdoor Mela', thittu: 'Badagu',
        date: '2026-06-01', time: '20:00', location: 'Perdoor Temple, Udupi District',
        latitude: 13.4500, longitude: 74.8500,
        description: 'The story of Goddess Devi and her battle against evil forces.',
        posterUrls: [], status: 'approved', submittedByName: 'YakshaNidhi',
      },
      {
        prasanga: 'Abhimanyu Kalaga', troupe: 'Dharmasthala Mela', thittu: 'Thenku',
        date: '2026-06-05', time: '21:00', location: 'Puttur Town Hall, Puttur',
        latitude: 12.7596, longitude: 75.2029,
        description: 'The heroic last stand of Abhimanyu in the Chakravyuha.',
        posterUrls: [], status: 'approved', submittedByName: 'YakshaNidhi',
      },
      {
        prasanga: 'Shani Mahatme', troupe: 'Amrutheshwari Mela', thittu: 'Thenku',
        date: '2026-06-10', time: '20:00', location: 'Mangalore Town Hall, Mangalore',
        latitude: 12.8714, longitude: 74.8431,
        description: 'The legend of Lord Shani and divine justice.',
        posterUrls: [], status: 'approved', submittedByName: 'YakshaNidhi',
      },
    ];

    await Event.insertMany(demoEvents);
    console.log(`🎭 Seeded ${demoEvents.length} demo events`);
  }
}

start();
