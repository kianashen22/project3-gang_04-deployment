
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const session = require('express-session');

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

// ??? - is this necessary
router.use((req, res, next) => {
  res.locals.defaultDrink = new Drink(0, 0, 'null', 0, 'null', 'null', 'null', 0.00);
  next();
});


//HOME PAGE--

router.get('/employeeHome', async (req, res) => {
  user = req.session.user;

  // LOADING DRINKS ON THE PAGE INFORMATION
  let freshBrew_drinks = []
  let fruity_drinks = []
  let iceBlended_drinks = []
  let milky_drinks = []
  try {
    let query_res1 = await pool.query("SELECT * FROM beverage_info WHERE category = 'Fresh Brew'");
    freshBrew_drinks = query_res1.rows;

    let query_res2 = await pool.query("SELECT * FROM beverage_info WHERE category = 'Fruity Beverage'");
    fruity_drinks = query_res2.rows;

    let query_res3 = await pool.query("SELECT * FROM beverage_info WHERE category = 'Ice Blended'");
    iceBlended_drinks = query_res3.rows;

    let query_res4 = await pool.query("SELECT * FROM beverage_info WHERE category = 'Milky Series'");
    milky_drinks = query_res4.rows;


    res.render('employee/employeeHome', {
      user: user,
      error: null ,
      freshBrew_drinks,
      fruity_drinks,
      iceBlended_drinks,
      milky_drinks
    });
  } catch (err) {
      if (err) {
        console.error('Unknown error:', err.message);
      }

      res.render('employee/employeeHome', {
        user: user,
        error: 'Error.',
        freshBrew_drinks,
        fruity_drinks,
        iceBlended_drinks,
        milky_drinks
      });
  }
});

// edit drink from order summary
router.post('/editItem', async(req, res) => {
    const itemIndex = req.body.itemIndex;
    // console.log("Received index:", itemIndex);

    return res.redirect(`/employee/modifyOrder?index=${itemIndex}`);
    // res.redirect('/employee/modifyOrder');
});


router.get('/modifyOrder', async (req, res) => {
  try {
    const itemIndex = Number(req.query.index);
    const cart = req.session.cart || [];

    if (itemIndex < 0 || itemIndex >= cart.length) {
      return res.redirect('/employee/orderSummary');
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

    return res.render('employee/modifyOrder', { 
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
  const newIce = req.body.iceLevel;
  const newSweetness = req.body.sweetnessLevel;

  let newToppings = [];
  try {
    newToppings = req.body.toppings ? JSON.parse(req.body.toppings) : [];
  } catch {
    newToppings = [];
  }

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
    item.iceLevel = newIce;
    item.sweetnessLevel = newSweetness;

    // ✅ MULTI TOPPING SUPPORT
    item.toppings = newToppings;
    item.toppingCharge = newToppings.length * 0.75;

    // ✅ PRICE FIX
    const price = Number(item.price) || 0;
    item.lineTotal = (price + item.toppingCharge) * newQuantity;

    req.session.cart[itemIndex] = item;

    req.session.save(() => {
      res.redirect('/employee/orderSummary');
    });
  } else {
    res.redirect('/employee/orderSummary');
  }
});


// Order Summary Page
router.get('/orderSummary', (req, res) => {
  const cart = req.session.cart || [];

  // totals
  const subtotal = cart.reduce((s, d) => s + (Number(d.price) + Number(d.toppingCharge || 0)) * Number(d.quantity), 0);
  const tax = subtotal * 0.085; 
  const total = subtotal + tax;


  res.render('employee/orderSummary', {
    order: { drinks: cart },
    totals: { subtotal, tax, total }
  });
});




// Tip Page
router.get('/tip', (req, res) => {
  res.render('employee/employeeTip');
});

router.get('/customerEmail', (req, res) => {
    res.render('employee/customerEmail', { message: '', customer: null });
});
router.post('/getIDFromEmail', async (req, res) => {
    console.log(req.body);
    const { email } = req.body;
    console.log(email);
    const result = await pool.query(
        `SELECT * FROM customer WHERE email = $1`,
        [email]
    );

    console.log(result);

    if (result.rowCount === 0) {
      console.log("No user found with email:", user.email);  
      return res.render('employee/customerEmail', {message: "Email not found", customer: null}); 
    }

  let customer = result.rows[0]
  req.session.customerId = customer.customer_id; 
  res.render('employee/customerEmail', {message: `Welcome back, ${customer.first_name}!`, customer: customer});
});





//order confirmation page
router.get('/orderConfirmation',async (req, res , next) => {
  try {
    console.log("ORDER CONFIRMATION EMPLOYEE ROUTE REACHED");
    
    const cart = req.session.cart || [];

    // if cart is empty, don't create a blank order
    if (cart.length === 0) {
      return res.redirect('/employee/orderSummary');
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

    const customerId = req.session.customerId || 1; // fallback to 1 if not set

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
    }

    // adding to database
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
    res.render('employee/orderConfirmation', {
      orderId,
      total
    });
  } catch (err) {
    next(err);
  }
});

//db functions
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



//customization page
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

    res.render('employee/drinkModifications', {
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
    toppings,
    quantity
  } = req.body;

  // ✅ Parse multi-toppings array
  let toppingList = [];
  try {
    toppingList = toppings ? JSON.parse(toppings) : [];
  } catch {
    toppingList = [];
  }

  const qty = Math.max(1, Number(quantity) || 1);
  const basePrice = Number(price) || 0;

  // ✅ Multi-topping pricing
  const toppingCharge = toppingList.length * 0.75;
  const lineTotal = (basePrice + toppingCharge) * qty;

  req.session.cart.push({
    beverageInfoId: Number(beverageInfoId),
    name,
    size,
    iceLevel,
    sweetnessLevel,
    toppings: toppingList,   // ✅ ARRAY now
    price: basePrice,
    toppingCharge,
    quantity: qty,
    lineTotal
  });

  return res.redirect('/employee/employeeHome');
});

router.post('/cart/remove', (req, res) => {
  const index = Number(req.body.index);

  if (!req.session.cart || isNaN(index)) {
      return res.redirect('/employee/orderSummary');
  }

  req.session.cart.splice(index, 1);
  return res.redirect('/employee/orderSummary');
});



// Export router 
module.exports = router;


