
// routes/customerRoutes.js
const ejs = require('ejs');
const path = require('path');
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


router.get('/customerHome', async (req, res) => {
    try {
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
            main: weatherResponse.data.weather[0].main,
        };

        res.render("customer/customerHome", {
            weather: data,
            error: null,
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

router.get('/menuAsst', async(req, res) => {

    try {
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
                res.render('customer/menuAsst', {
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

        res.render('customer/menuAsst', {
        weather: null,
        error: 'Error fetching weather.',
        });
    }
});

// DB functions to retrieve DRINK MODIFICATIONS
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
        return ['no ice', 'light ice', 'regular', 'extra ice'];
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





 



router.get('/customerOrder', async (req, res) => {
    try {
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
            main: weatherResponse.data.weather[0].main,
        };

        // LOADING DRINKS ON THE PAGE INFORMATION
        const freshBrew_drinks =
            (await pool.query("SELECT * FROM beverage_info WHERE category = 'Fresh Brew'")).rows;

        const fruity_drinks =
            (await pool.query("SELECT * FROM beverage_info WHERE category = 'Fruity Beverage'")).rows;

        const iceBlended_drinks =
            (await pool.query("SELECT * FROM beverage_info WHERE category = 'Ice Blended'")).rows;

        const milky_drinks =
            (await pool.query("SELECT * FROM beverage_info WHERE category = 'Milky Series'")).rows;

        const all_drinks =
            (await pool.query("SELECT * FROM beverage_info")).rows;

        let filtered_drinks = all_drinks;

        req.session.allDrinks = all_drinks

        const inventory =
            (await pool.query("SELECT * FROM inventory")).rows;
        
        res.render("customer/customerOrder", {
            weather: data,
            error: null,
            freshBrew_drinks,
            fruity_drinks,
            iceBlended_drinks,
            milky_drinks,
            all_drinks,
            filtered_drinks,
            inventory,
            user: req.session.user,
        });

    } catch (err) {
        if (err.response) {
            console.error('OpenWeather error:', err.response.status, err.response.data);
        } else {
            console.error('Unknown error:', err.message);
        }

        res.render('customer/customerOrder', {
            weather: null,
            error: 'Error fetching weather.',
            user: req.session.user
        });
    }
});






// Drink Modifications Page
router.get('/drinkModifications', (req, res) => {
    console.log(" /drinkModifications route HIT");
    res.render('customer/drinkModifications');
});


// edit drink from order summary
router.post('/editItem', async(req, res) => {
    const itemIndex = req.body.itemIndex;
    console.log("Received index:", itemIndex);

    return res.redirect(`/customer/modifyOrder?index=${itemIndex}`);
    // res.redirect('/employee/modifyOrder');
});

router.get('/modifyOrder', async (req, res) => {
  try {
    const itemIndex = Number(req.query.index);
    const cart = req.session.cart || [];


    if (itemIndex < 0 || itemIndex >= cart.length) {
      return res.redirect('/customer/orderSummary');
    }

    const drinkToEdit = cart[itemIndex];

    // Load needed lists
    const [iceLevels, sugarLevels, toppingsRaw] = await Promise.all([
      db.getIceLevels(),
      db.getSugarLevels(),
      db.getToppings()
    ]);

    // Remove duplicate toppings (same logic as customize)
    const seen = new Set();
    const toppings = [];
    for (const t of toppingsRaw) {
      const name = t.topping_name || t.name;
      if (!seen.has(name)) {
        seen.add(name);
        toppings.push(t);
      }
    }

    return res.render('customer/modifyOrder', { 
      drink: drinkToEdit, 
      index: itemIndex,
      iceLevels,
      sugarLevels,
      toppings
    });

    } catch (err) {
      next (err);
    }
});

router.post('/updateCartItem', (req, res) => {
    const itemIndex = Number(req.body.itemIndex);
    const newQuantity = Number(req.body.quantity);
    const newSize = req.body.size;
    const newTopping = req.body.topping;
    const newIce = req.body.iceLevel;
    const newSweetness = req.body.sweetnessLevel;
    const cart = req.session.cart || [];

    if (
        Number.isInteger(itemIndex) &&
        itemIndex >= 0 &&
        itemIndex < cart.length &&
        newQuantity > 0
    ) {
        const item = cart[itemIndex];
        item.quantity = newQuantity;
        item.size = newSize;
        item.topping = newTopping;
        item.iceLevel = newIce;
        item.sweetnessLevel = newSweetness;

        // Recalculate line total
        const price = Number(item.price) || 0;
        const toppingCharge = Number(item.toppingCharge || 0);
        item.lineTotal = (price + toppingCharge) * newQuantity;

        req.session.cart[itemIndex] = item;

        req.session.save(() => {
            res.redirect('/customer/orderSummary');
        });
    } else {
        res.redirect('/customer/orderSummary');
    }
});

// Order Summary Page
router.get('/orderSummary', async(req, res) => {

    // Weather API
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
        main: weatherResponse.data.weather[0].main,
    };
    const cart = req.session.cart || [];

    // totals
    const subtotal = cart.reduce((s, d) => s + (Number(d.price) + Number(d.toppingCharge || 0)) * Number(d.quantity), 0);
    const tax = subtotal * 0.085;
    const total = subtotal + tax;

    res.render('customer/orderSummary', {
        order: { drinks: cart },
        totals: { subtotal, tax, total }, weather:data
    });
});

//order confirmation page
router.get('/orderConfirmation',async (req, res , next) => {
    try {
        console.log("ORDER CONFIRMATION CUSTOMER ROUTER LOADED");
        const cart = req.session.cart || [];

        // bool to check if order confirmation page should be populated
        let displayOrderSessionCheck = true;
        let displayOrderIDCheck = true;

        // if cart is empty, don't create a blank order
        if (cart.length === 0) {
            displayOrderSessionCheck = false;
        }

        // voice agent did not make an order
        const orderIDCheck = req.query.orderId;
        if (!orderIDCheck) {
            displayOrderIDCheck = false;
        }

        if (!displayOrderIDCheck && !displayOrderSessionCheck){
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

        const cupInventoryIds = {
            small: 23,
            regular: 19,
            large: 20
        };

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
        const user = req.session.user
        if (user && user.role == 'customer') {
            customerId = user.id;
        } else {
            customerId = 1;   
        }

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
    NOW()
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


        // removing stock level from inventory for items in
        for (const item of cart) {
            const qty = Number(item.quantity);

            if (!Number.isFinite(qty) || qty <= 0) {
                console.error("Invalid quantity for item:", item);
                continue;  // or throw an error
            }

            await pool.query(
                "UPDATE inventory " +
                "SET stock_level = inventory.stock_level - $1 " +
                "FROM menu_inventory " +
                "WHERE menu_inventory.inventory_id = inventory.inventory_id " +
                "AND menu_inventory.beverage_info_id = $2;",
                [qty, item.beverageInfoId]
            );

            // cups
            const cupId = cupInventoryIds[item.size] || cupInventoryIds['regular'];
            await pool.query(
                `UPDATE inventory SET stock_level = stock_level - $1 WHERE inventory_id = $2`,
                [qty, cupId]
            );

            await pool.query(
                "UPDATE inventory SET stock_level = inventory.stock_level - $1 " +
                "WHERE inventory_id = 21;",
                [qty]
            );

            await pool.query (
                "UPDATE inventory SET stock_level = inventory.stock_level - $1 " +
                "WHERE inventory_id = 22;",
                [qty]
            );
            if (item.topping) {
                const toppingName = item.topping;

                // get inventory_id for the topping
                const result = await pool.query(
                    `SELECT inventory_id 
                    FROM inventory
                    WHERE name = $1`,
                    [toppingName]
                );

                if (result.rows.length > 0) {
                    const toppingInvId = result.rows[0].inventory_id;

                    // decrease topping stock
                    await pool.query(
                    `UPDATE inventory 
                    SET stock_level = stock_level - $1 
                    WHERE inventory_id = $2`,
                    [qty, toppingInvId]
                    );
                } else {
                    console.error("Topping not found in inventory table:", toppingName);
                }
            }
        }


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

        // Weather API
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
        console.log(
          'FULL WEATHER JSON:\n',
          JSON.stringify(weatherResponse.data, null, 2)
        );
        const data = {
            city: weatherResponse.data.name,
            temp: weatherResponse.data.main.temp,
            feelsLike: weatherResponse.data.main.feels_like,
            description: weatherResponse.data.weather[0].description,
            main: weatherResponse.data.weather[0].main,
        };

        console.log('ICON SOURCE:', weatherResponse.data.weather[0].main);
        res.render('customer/orderConfirmation', {
            orderId,
            total, weather:data,
            user
        });
    } catch (err) {
        next(err);
    }
});



router.get('/:id/customize', async (req, res, next) => {
    try {

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
            main: weatherResponse.data.weather[0].main,
        };

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
            weather:data
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
    return res.redirect('/customer/customerOrder');
});



// FUNCTIONS
router.post('/search', async (req, res) => {
    console.log("/search route HIT");
    console.log(req.body);

    try {
        console.log("LIST RECEIVED:", req.body.selectedIngredients);
        let list = req.body.selectedIngredients;
        list = list.map(Number);

        console.log(list, "TYPE ", typeof list);

        let filtered_drinks = [];

        if(list.length === 0){
            filtered_drinks = req.session.allDrinks;
        }
        else
        {
            const query = `SELECT b.*
                           FROM beverage_info b
                           WHERE b.beverage_info_id IN (
                               SELECT beverage_info_id
                               FROM menu_inventory
                               WHERE inventory_id = ANY($1)                         -- $1 is an array like [1,2,3]
                               GROUP BY beverage_info_id
                               HAVING COUNT(DISTINCT inventory_id) = cardinality($1)  -- MUST match ALL items
                           );   
            `;

            const result = await pool.query(query, [list]);
            filtered_drinks = result.rows;
        }

        console.log(filtered_drinks);

        //TODO

        const html = await ejs.renderFile(
            path.join(__dirname, '../views/customer/_drinksList.ejs'),
            {
                filtered_drinks,
                img_array: res.locals.img_array,
            }
        );

        res.json({ html });

    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.post('/cart/remove', (req, res) => {
  const index = Number(req.body.index);

  if (!req.session.cart || isNaN(index)) {
      return res.redirect('/customer/orderSummary');
  }

  req.session.cart.splice(index, 1);
  return res.redirect('/customer/orderSummary');
});



//customer Profile
router.get('/customerProfile', async (req, res) => {
        const user = req.session.user;
    try {
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
            main: weatherResponse.data.weather[0].main,
        };
        const past_orders =
            (await pool.query(
                `SELECT 
                o.*,
                COALESCE(
                    json_agg(b.*) FILTER (WHERE b.beverage_id IS NOT NULL),
                    '[]'
                ) AS beverages
                FROM "order" o 
                LEFT JOIN beverage b 
                ON o.order_id = b.order_id

                WHERE customer_id = $1
                GROUP BY o.order_id
                ORDER BY o.order_id;`, 
                [user.id]
            )).rows;



        res.render("customer/customerProfile", {
            weather: data,
            error: null,
            user: user,
            past_orders: past_orders
        });

    } catch (err) {
        if (err.response) {
            console.error('OpenWeather error:', err.response.status, err.response.data);
        } else {
            console.error('Unknown error:', err.message);
        }

        res.render('customer/customerProfile', {
            weather: null,
            error: 'Error fetching weather.',
            user: user,
            past_orders: past_orders
        });
    }
});


router.post('/updateName', async (req, res) => {
    const user = req.session.user;
    const { name } = req.body;
    if (!user) {
        return res.status(401).send('Not logged in');
    }

    if (!name || name.trim() === '') {
        return res.status(400).send('Name cannot be empty.');
    }

    await pool.query(
        'UPDATE customer SET first_name = $1 WHERE customer_id = $2',
        [name.trim(), user.id]
    );
    req.session.user.name = name.trim();

    res.redirect('/customer/customerProfile');
});


// Export router
module.exports = router;