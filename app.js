require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const morgan = require('morgan');
const app = express();

// Use the 'morgan' middleware for logging HTTP requests
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Include and use your routes here
const authRoutes = require('./Routes/authRoutes');
const userRoutes = require('./Routes/userRoutes');

app.use('/auth', authRoutes);
app.use('/user', userRoutes);

app.get('/', (req, res) => {
  res.send({ message: 'Awesome it works 🐻', my_env_var: process.env.MY_VAR });
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
