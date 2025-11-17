// routes/employeeRoutes.js
const express = require('express');
// const { Pool } = require('pg');
// const dotenv = require('dotenv').config();

// Create router instead of app
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true })); //allows for passing data from forms


// Create pool
// const pool = new Pool({
//   user: process.env.PSQL_USER,
//   host: process.env.PSQL_HOST,
//   database: process.env.PSQL_DATABASE,
//   password: process.env.PSQL_PASSWORD,
//   port: process.env.PSQL_PORT,
//   ssl: { rejectUnauthorized: false },
// });

// // Handle shutdown
// process.on('SIGINT', function () {
//   pool.end();
//   console.log('Application successfully shutdown');
//   process.exit(0);
// });

router.get('/employeeHome', (req, res) => {
  res.render('employee/employeeHome', {user: req.session.user});
});


module.exports = router;