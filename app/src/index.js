const express = require('express');
const morgan = require('morgan');
const { register, httpRequestDurationMicroseconds } = require('./metrics');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(morgan('combined'));

// Metrics collection middleware
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ route: req.path, code: res.statusCode, method: req.method });
  });
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Industry-Grade CI/CD Demo API!',
    version: '1.0.0',
    status: 'Running',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Simulation of a heavy task for monitoring
app.get('/work', (req, res) => {
  const start = Date.now();
  while (Date.now() - start < 100) {
    // Artificial delay
  }
  res.json({ message: 'Work done' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
}


module.exports = app;
