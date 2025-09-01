require('dotenv').config();

const express = require('express');
const cors = require("cors");
const connectDB = require('./db');
const routes = require('./routes');

const app = express();

app.use(cors({
  origin: ['http://localhost:4200', 'https://reddragonsociety.com', 'https://www.reddragonsociety.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));

const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, './images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

app.use('/api', routes);

app.use('/images', express.static('images'));

const PORT = process.env.PORT || 8080;

connectDB();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});