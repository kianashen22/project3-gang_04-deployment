// routes/customerRoutes.js
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

// Create router instead of app
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true })); //allows for passing data from forms


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

// Routes for customer pages
router.get('/customerHome', (req, res) => {
    console.log("Customer homepage hit!");
    res.render('customer/customerHome');
});



router.get('/freshBrew', (req, res) => {
    let freshBrew_drinks = []
    pool
        .query('SELECT * FROM beverage_info WHERE category = \'Fresh Brew\'')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                freshBrew_drinks.push(query_res.rows[i]);
            }
            const data = {freshBrew_drinks: freshBrew_drinks};
            console.log(freshBrew_drinks);
            res.render('customer/freshBrew', data);
        });
});



router.get('/fruity', (req, res) => {
    let fruity_drinks = []
    pool
        .query('SELECT * FROM beverage_info WHERE category = \'Fruity Beverage\'')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                fruity_drinks.push(query_res.rows[i]);
            }
            const data = {fruity_drinks: fruity_drinks};
            console.log(fruity_drinks);
            res.render('customer/fruity', data);
        });
});



router.get('/iceBlended', (req, res) => {
  console.log("/iceBlended route HIT");
    let iceBlended_drinks = []
    pool
        .query('SELECT * FROM beverage_info WHERE category = \'Ice Blended\'')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
              iceBlended_drinks.push(query_res.rows[i]);
            }
            const data = {iceBlended_drinks: iceBlended_drinks};
            console.log(iceBlended_drinks);
            res.render('customer/iceBlended', data);
        });
});


router.get('/milky', (req, res) => {
  console.log(" /milky route HIT");
    let milky_drinks = []
    pool
        .query('SELECT * FROM beverage_info WHERE category = \'Milky Series\'')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                milky_drinks.push(query_res.rows[i]);
            }
            const data = {milky_drinks: milky_drinks};
            console.log(milky_drinks);
            res.render('customer/milky', data);
        });
});

router.get('/orderSummary', (req, res) => {
  res.render('customer/orderSummary');
});








// Export router 
module.exports = router;
