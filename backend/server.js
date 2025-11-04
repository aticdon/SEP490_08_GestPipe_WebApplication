require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const translationRoutes = require('./src/routes/translationRoutes');
const gestureRoutes = require('./src/routes/gestureRoutes');
const practiceRoutes = require('./src/routes/practiceRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/gestures', gestureRoutes);
app.use('/api/practice', practiceRoutes);

// Simple route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
