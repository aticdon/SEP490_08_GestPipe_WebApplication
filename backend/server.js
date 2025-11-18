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
const adminCustomGestureRoutes = require('./src/routes/adminCustomGestureRoutes');
const translationRoutes = require('./src/routes/translationRoutes');
const gestureRoutes = require('./src/routes/gestureRoutes');
const practiceRoutes = require('./src/routes/practiceRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const userRoutes = require('./src/routes/userRoutes');
const versionRoutes = require('./src/routes/versionRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin-custom-gestures', adminCustomGestureRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/gestures', gestureRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/user', userRoutes);
app.use('/api/versions', versionRoutes);

// Simple route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Test route without auth
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
