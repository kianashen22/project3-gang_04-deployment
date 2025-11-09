
// routes/customerRoutes.js
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

// create image arrays
// milky image will be the default drink image when a new drink is created unless added to the array
// use beverage_info id to index the array for corresponding image. if beverage_info id > size of array -> use default photo (milky --> index 0)
let img_array = ['/img/milky.png', '/img/classicTea.png', '/img/classicTea.png', '/img/classicTea.png', '/img/honeyTea.png', '/img/honeyTea.png', '/img/honeyTea.png',
                  '/img/classic-pearl-milk-tea.png', '/img/honey-pearl-milk-tea.png', '/img/mango-green-milk-tea.png', '/img/coffee-crema.png', '/img/thai-pearl-milk-tea.png', '/img/taro-pearl-milk-tea.png', 
                  '/img/honeyLemonade.png', '/img/mangoGreenTea.png', '/img/mangoPassionfruitTea.png', 
                  '/img/peachTeaBlended.png', '/img/thaiBlended.png', '/img/taroBlended.png', '/img/coffeeBlended.png', '/img/mangoBlended.png' ];


// create ORDER object
function Order(customer_id, total_price, month, week, date, hour, year, combine_date){
  this.customer_id = customer_id;
  this.total_price = total_price;
  this.month = month;
  this.week = week;
  this.date = date;
  this.hour = hour;
  this.year = year;
  this.combine_date = combine_date;
}

// create DRINK object
function Drink(order_id, beverage_info_id, beverage_name, quantity, ice_level, sweetness_level, size, price){
  this.order_id = order_id;
  this.beverage_info_id = beverage_info_id;
  this.beverage_name = beverage_name;
  this.quantity = quantity;
  this.ice_level = ice_level;
  this.sweetness_level = sweetness_level;
  this.size = size;
  this.price = price
}



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

// create middleware so that img_array can be accessed by all ejs files
router.use((req, res, next) => {
  res.locals.img_array = img_array;
  res.locals.defaultDrink = new Drink(0, 0, 'null', 0, 'null', 'null', 'null', 0.00);
  next();
});


// Routes for customer pages
router.get('/customerHome', (req, res) => {
    console.log("Customer homepage hit!");
    res.render('customer/customerHome');
});


// Fresh Brew Page
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


// Fruity Page
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


// Ice Blended Page
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


// Milky Page
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

// Drink Modifications Page
router.get('/drinkModifications', (req, res) => {
  console.log(" /drinkModifications route HIT");
  res.render('customer/drinkModifications');
});

// Order Summary Page
router.get('/orderSummary', (req, res) => {

  res.render('customer/orderSummary');
});












// Export router 
module.exports = router;
