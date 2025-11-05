// routes/managerRoutes.js
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

// Create router instead of app
const router = express.Router();

// Create pool
const pool = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: process.env.PSQL_PORT,
  ssl: { rejectUnauthorized: false },
});

// Handle shutdown
process.on('SIGINT', function () {
  pool.end();
  console.log('Application successfully shutdown');
  process.exit(0);
});

// Routes for manager pages
router.get('/managerHome', (req, res) => {
  res.render('manager/managerHome');
});

router.get('/inventory/inventoryHome', (req, res) => {
  res.render('manager/inventory/inventoryHome');
});

router.get('/analytics/analyticsOptions', (req, res) => {
  res.render('manager/analytics/analyticsOptions');
});

router.get('/employeeModification', (req, res) => {
  res.render('manager/employeeModification');
});

router.get('/menuModification', (req, res) => {
    res.render('manager/menuModification');
});

// Export router 
module.exports = router;
