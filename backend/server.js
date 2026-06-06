const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors());
app.use(express.json()); // Allows our app to read JSON data sent to it

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🚀 Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error: ', err));

// Simple base route to check if server is running
app.get('/', (req, res) => {
  res.send('ECHO API is running...');
});

// Start listening for requests
app.listen(PORT, () => {
  console.log(`📡 Server is spinning on port ${PORT}`);
});