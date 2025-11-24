
// routes/customerRoutes.js
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const session = require('express-session');
const axios = require('axios');

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

router.use(session({
  secret: 'dev-only-change-this',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));
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
// router.get('/customerHome', (req, res) => {
//     console.log("Customer homepage hit!");

//     res.render('customer/customerHome');
// });



// router.get('/customerHome', async (req, res) => {
//   try {
//     console.log("Customer homepage hit!");

//     const city = req.query.city || 'College Station';

//     const apiKey = process.env.OPENWEATHER_API_KEY;
//     console.log('OpenWeather key present:', !!apiKey);

//     const weatherResponse = await axios.get(
//       'https://api.openweathermap.org/data/2.5/weather',
//       {
//         params: {
//           q: city,
//           appid: apiKey,
//           units: 'imperial',
//         },
//       }
//     );

//     const data = {
//       city: weatherResponse.data.name,
//       temp: weatherResponse.data.main.temp,
//       feelsLike: weatherResponse.data.main.feels_like,
//       description: weatherResponse.data.weather[0].description,
//     };

//     res.render('customer/customerHome', { weather: data, error: null });
//   } catch (err) {
//     if (err.response) {
//       console.error('OpenWeather error:', err.response.status, err.response.data);
//     } else {
//       console.error('Unknown error:', err.message);
//     }

//     res.render('customer/customerHome', {
//       weather: null,
//       error: 'Error fetching weather.',
//     });
//   }
// });

router.get('/customerHome', async (req, res) => {
  try {
    console.log("Customer homepage hit!");
    // WEATHER API INFORMATION

      const city = req.query.city || 'College Station';

    const apiKey = process.env.OPENWEATHER_API_KEY;
    console.log('OpenWeather key present:', !!apiKey);

    const weatherResponse = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          q: city,
          appid: apiKey,
          units: 'imperial',
        },
      }
    );

    const data = {
      city: weatherResponse.data.name,
      temp: weatherResponse.data.main.temp,
      feelsLike: weatherResponse.data.main.feels_like,
      description: weatherResponse.data.weather[0].description,
    };

    // LOADING DRINKS ON THE PAGE INFORMATION
    let freshBrew_drinks = []
    let fruity_drinks = []
    let iceBlended_drinks = []
    let milky_drinks = []
    let all_drinks = []
    pool
        .query('SELECT * FROM beverage_info WHERE category = \'Fresh Brew\'')
        .then(query_res1 => {
            for (let i = 0; i < query_res1.rowCount; i++){
                freshBrew_drinks.push(query_res1.rows[i]);
            }
            return pool.query('SELECT * FROM beverage_info WHERE category = \'Fruity Beverage\'')
        })

        .then(query_res2 => {
            for (let i = 0; i < query_res2.rowCount; i++){
                fruity_drinks.push(query_res2.rows[i]);
            }
            return pool.query('SELECT * FROM beverage_info WHERE category = \'Ice Blended\'')
        })

        .then(query_res3 => {
            for (let i = 0; i < query_res3.rowCount; i++){
              iceBlended_drinks.push(query_res3.rows[i]);
            }
            return pool.query('SELECT * FROM beverage_info WHERE category = \'Milky Series\'')
        })

        .then(query_res4 => {
            for (let i = 0; i < query_res4.rowCount; i++){
                milky_drinks.push(query_res4.rows[i]);
            }
            return pool.query('SELECT * FROM beverage_info')
        })

        .then(query_res5 => {
            for (let i = 0; i < query_res5.rowCount; i++){
                all_drinks.push(query_res5.rows[i]);
            }
            res.render('customer/customerHome', {
              weather: data, 
              error: null ,
              freshBrew_drinks,
              fruity_drinks,
              iceBlended_drinks,
              milky_drinks,
              all_drinks
            });
        });
} catch (err) {
    if (err.response) {
      console.error('OpenWeather error:', err.response.status, err.response.data);
    } else {
      console.error('Unknown error:', err.message);
    }

    res.render('customer/customerHome', {
      weather: null,
      error: 'Error fetching weather.',
    });
}
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
  const cart = req.session.cart || [];

  // totals
  const subtotal = cart.reduce((s, d) => s + (Number(d.price) + Number(d.toppingCharge || 0)) * Number(d.quantity), 0);
  const tax = subtotal * 0.085; 
  const total = subtotal + tax;

  res.render('customer/orderSummary', {
    order: { drinks: cart },
    totals: { subtotal, tax, total }
  });
});

//order confirmation page
router.get('/orderConfirmation',async (req, res , next) => {
  try {
    const cart = req.session.cart || [];

    // if cart is empty, don't create a blank order
    if (cart.length === 0) {
      return res.redirect('/customer/orderSummary');
    }

    // --- compute totals (same logic as orderSummary) ---
    const subtotal = cart.reduce(
      (sum, item) =>
        sum +
        (Number(item.price) + Number(item.toppingCharge || 0)) *
          Number(item.quantity || 1),
      0
    );
    const tax = subtotal * 0.085;
    const total = subtotal + tax;

    // --- time breakdown for analytics columns ---
    const now = new Date();
    const month = now.getMonth() + 1;   // 1–12
    const date = now.getDate();         // 1–31
    const year = now.getFullYear();     // e.g. 2025
    const hour = now.getHours();        // 0–23

    const startOfYear = new Date(year, 0, 1);
    const daysSince = Math.floor(
      (now - startOfYear) / (1000 * 60 * 60 * 24)
    );
    const week = Math.floor(daysSince / 7) + 1;

    // combine_date is DATE, so use yyyy-mm-dd
    const combine_date = now.toISOString().slice(0, 10);

    const customerId = 1; // or whatever real customer_id you use

const orderResult = await pool.query(
  `
  INSERT INTO "order" (
    customer_id,
    total_price,
    month,
    week,
    date,
    hour,
    year,
    combine_date
  )
  VALUES (
    $1,
    $2,
    EXTRACT(MONTH FROM NOW())::int,
    EXTRACT(WEEK  FROM NOW())::int,
    EXTRACT(DAY   FROM NOW())::int,
    EXTRACT(HOUR  FROM NOW())::int,
    EXTRACT(YEAR  FROM NOW())::int,
    CURRENT_DATE
  )
  RETURNING order_id
  `,
  [customerId, total]
);

    const orderId = orderResult.rows[0].order_id;
    const maxResult = await pool.query(
      'SELECT COALESCE(MAX(beverage_id), 0) AS max_id FROM beverage'
    );
    let nextBeverageId = maxResult.rows[0].max_id + 1;
    // --- 2) insert each beverage tied to this order ---
    const insertBeverageSql = `
      INSERT INTO beverage
        (beverage_id, order_id, beverage_info_id, beverage_name,
         quantity, ice_level, sweetness_level, size, price)
      VALUES
        ($1,          $2,       $3,              $4,
     $5,          $6,       $7,              $8,   $9)
    `;

    for (const item of cart) {
      const unitPrice =
        Number(item.price) + Number(item.toppingCharge || 0);
    
      await pool.query(insertBeverageSql, [
        nextBeverageId,                       // beverage_id we control
        orderId,                              // FK to "order"
        Number(item.beverageInfoId),          // FK to beverage_info
        item.name,
        Number(item.quantity) || 1,
        item.iceLevel || null,
        item.sweetnessLevel || null,
        item.size || null,
        unitPrice,
      ]);
    
      nextBeverageId++; // bump ID for the next row
    }

    // --- 3) clear cart ---
    req.session.cart = [];

    // --- 4) render confirmation ---
    res.render('customer/orderConfirmation', {
      orderId,
      total
    });
  } catch (err) {
    next(err);
  }
});
const db = {
  async getDrink(id) {
    const q = `
      SELECT beverage_info_id, name, price
      FROM beverage_info
      WHERE beverage_info_id = $1
    `;
    const { rows } = await pool.query(q, [id]);
    return rows[0] || null;
  },

  async getIceLevels() {
    return ['no ice', 'light ice', 'regular ice', 'extra ice'];
  },

  async getSugarLevels() {
    return ['0%', '30%', '50%', '80%', '100%', '120%'];
  },

  async getToppings() {
    const q = `
      SELECT beverage_topping_id, topping_name
      FROM beverage_toppings
      ORDER BY beverage_topping_id
    `;
    const { rows } = await pool.query(q);
    return rows;
  },
};
router.get('/:id/customize', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).render('404', { message: 'Invalid item id.' });
    }

    const [drink, iceLevels, sugarLevels, toppingsRaw] = await Promise.all([
      db.getDrink(id),          
      db.getIceLevels(),         
      db.getSugarLevels(),      
      db.getToppings(),          
    ]);

    if (!drink) {
      return res.status(404).render('404', { message: 'Drink not found.' });
    }
    const seen = new Set();
    const toppings = [];
    for (const t of toppingsRaw) {
      const name = t.topping_name || t.name;
      if (seen.has(name)) continue;
      seen.add(name);
      toppings.push(t);
    }
    // Provide sensible defaults so the template can preselect values
    const defaults = {
      quantity: 1,
      size: 'small',
      iceLevel: 'regular',
      sugarLevel: '100%',
      toppingIds: [], // none selected
      action: 'add',
    };

    res.render('customer/drinkModifications', {
      drink,
      iceLevels,
      sugarLevels,
      toppings,
      defaults,
    });
  } catch (err) {
    next(err);
  }
});
router.post('/cart/add', (req, res) => {
  if (!req.session.cart) req.session.cart = [];

  const {
    beverageInfoId,
    name,
    price,
    size,
    iceLevel,
    sweetnessLevel,
    topping,
    action,
    quantity
  } = req.body;


  const qty = Math.max(1, Number(quantity) || 1);
  const basePrice = Number(price) || 0;
  const toppingCharge = (action === 'add' && topping) ? 0.75 : 0; 
  const lineTotal = (basePrice + toppingCharge) * qty;

  req.session.cart.push({
    beverageInfoId: Number(beverageInfoId),
    name,
    size,
    iceLevel,
    sweetnessLevel,
    topping: topping || null,                   
    price: basePrice,
    toppingCharge,
    quantity: qty,
    lineTotal
  });
  console.log('CART NOW:', req.session.cart);
  return res.redirect('/customer/customerHome');
});

// FUNCTIONS




// Export router 
module.exports = router;
