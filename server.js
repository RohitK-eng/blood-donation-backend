const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const donorRoutes = require('./routes/donorRoutes');
const requestRoutes = require('./routes/requestRoutes');

const app = express();
const INSTANCE_ID = process.env.INSTANCE_ID || "local";

app.use((req, res, next) => {
    res.setHeader("X-Served-By", INSTANCE_ID);
    next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);
// Add this near your other routes
const authRoutes = require("./routes/auth");

// Mount the route middleware
app.use("/api/auth", authRoutes);

// Health check route (useful to verify deployment works)
app.get('/', (req, res) => {
  res.json({ message: 'Blood Donation Management API is running' });
});

app.get("/whoami", (req, res) => {
    res.json({
        message: "Blood Donation Backend",
        instance: INSTANCE_ID
    });
});

// Connect to MongoDB Atlas and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });
