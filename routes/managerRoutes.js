// routes/managerRoutes.js
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

// Routes for manager pages
router.get('/managerHome', (req, res) => {
  res.render('manager/managerHome');
});



//analytics
router.get('/analytics/analyticsOptions', (req, res) => {
  res.render('manager/analytics/analyticsOptions');
});

router.get('/analytics/productUsageChart', (req, res) => {
    product_usage = []
    pool
        // SELECT COUNT(*) AS drink_count, SUM(I.qt) AS quantity, Y.name AS item_name, COUNT(*) * SUM(I.qt) AS total_quantity
        .query('SELECT COUNT(*) AS drink_count, SUM(I.qt) AS quantity, Y.name AS item_name, COUNT(*) * SUM(I.qt) "AS total_quantity FROM beverage B JOIN "order" O ON O.order_id = B.order_id JOIN menu_inventory I ON I.beverage_info_id = B.beverage_info_id JOIN inventory Y ON I.inventory_id = Y.inventory_id GROUP BY Y.name ORDER BY total_quantity DESC')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                product_usage.push(query_res.rows[i]);
            }
            const data = {product_usage: product_usage};
            console.log(product_usage);
            res.render('manager/analytics/productUsageChart', data);
        });
});

// sets data from current daily_total table in database
router.get('/analytics/zReport', (req, res) => {
  zReportData = []
    pool
        .query('SELECT * FROM daily_total;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                zReportData.push(query_res.rows[i]);
            }
            const data = {zReportData: zReportData};
            console.log(zReportData);
            res.render('manager/analytics/zReport', data);
        });
});

// generate new z-report data
router.post('/generateZReport', async (req, res) => {
  console.log('Generating Z Report...');
  await pool.query("WITH daily AS ( SELECT COALESCE(SUM(total_price), 0) AS daily_sales, " + 
                    "COALESCE(SUM(total_price) * 0.08, 0) AS daily_tax, COALESCE(COUNT(DISTINCT CASE WHEN DATE(combine_date) " +
                    "= CURRENT_DATE THEN customer_id END), 0) AS new_customers, COALESCE(COUNT(order_id), 0) AS order_total, " +
                    "COALESCE(COUNT(DISTINCT customer_id), 0) AS customer_total FROM \"order\" WHERE combine_date >= CURRENT_DATE "+
                    "AND combine_date < CURRENT_DATE + INTERVAL '1 day' ) UPDATE daily_total SET daily_sales = daily.daily_sales, "+
                    "daily_tax = daily.daily_tax, new_customers = daily.new_customers, order_total = daily.order_total, "+
                    "customer_total = daily.customer_total FROM daily;");
  res.redirect('/manager/analytics/zReport');
});

// gets relevent data from database for ordering trends page
router.get('/analytics/orderingTrends', async (req, res) => {
  try {
      // queries
      const peakWeekResult = await pool.query("SELECT week, SUM(total_price) AS weekly_sales FROM \"order\" " +
                                              "GROUP BY week ORDER BY weekly_sales DESC LIMIT 1;");
      const peakHourResult = await pool.query("SELECT hour, SUM(total_price) AS total_sales FROM \"order\" " +
                                              "GROUP BY hour ORDER BY total_sales DESC LIMIT 1;");
      const listTopDrinksResult = await pool.query("SELECT B.beverage_name, COUNT(*) AS drink_count FROM \"order\" " +
                                                   "O JOIN beverage B ON O.order_id = B.order_id GROUP BY " +
                                                   "B.beverage_name ORDER BY drink_count DESC LIMIT 6;")

      const peakWeek = peakWeekResult.rows[0] || null;
      const peakHour = peakHourResult.rows[0] || null;
      const listTopDrink = listTopDrinksResult.rows || [];

      // render to ejs
      res.render('manager/analytics/orderingTrends', {
        peakWeek,
        peakHour,
        listTopDrink
      });
      
    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
    }
});

router.get('/menuModification', (req, res) => {
    res.render('manager/menuModification');
});

//inventory
router.get('/inventory/inventoryHome', (req, res) => {
    inventory = []
    pool
        .query('SELECT * FROM inventory;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventory.push(query_res.rows[i]);
            }
            const data = {inventory: inventory};
            console.log(inventory);
            res.render('manager/inventory/inventoryHome', data);
        });
});

router.get('/inventory/baseInventory', (req, res) => {
  res.render('manager/inventory/baseInventory');
});

router.get('/inventory/teaInventory', (req, res) => {
  inventoryTea = []
    pool
        .query("SELECT inventory_id, name, stock_level FROM inventory WHERE name IN ('Green Tea', 'Oolong Tea', 'Black Tea', 'Coffee');")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventoryTea.push(query_res.rows[i]);
            }
            const data = {inventoryTea: inventoryTea};
            console.log(inventoryTea);
            res.render('manager/inventory/teaInventory', data);
        });
});

// update tea inventory stock
router.post('/updateTeaStock', async (req, res) => {
  console.log('Updating tea stock...');
  await pool.query("UPDATE inventory SET stock_level = 100 WHERE inventory_id IN (1, 2, 3, 4);");
  res.redirect('/manager/inventory/teaInventory');
});


router.get('/inventory/disposablesInventory', (req, res) => {
  inventoryDisposables = []
    pool
        .query("SELECT inventory_id, name, stock_level FROM inventory WHERE name IN ('Regular Cups', 'Large Cups', 'Straws', 'Plastic Lid');")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventoryDisposables.push(query_res.rows[i]);
            }
            const data = {inventoryDisposables: inventoryDisposables};
            console.log(inventoryDisposables);
            res.render('manager/inventory/disposablesInventory', data);
        });
});

// update disposable inventory stock
router.post('/updateDisposableStock', async (req, res) => {
  console.log('Updating disposable stock...');
  await pool.query("UPDATE inventory SET stock_level = 100 WHERE inventory_id IN (19, 20, 21, 22);");
  res.redirect('/manager/inventory/disposablesInventory');
});

router.get('/inventory/toppingsInventory', (req, res) => {
  inventoryToppings = []
    pool
        .query("SELECT inventory_id, name, stock_level FROM inventory WHERE name " +
                "IN ('Coffee Jelly', 'Lychee Jelly', 'Tapioca Pearl', 'Thai powder', " +
                "'Taro powder', 'Peach', 'Honey', 'Mango', 'Passionfruit', 'Ice cream');")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventoryToppings.push(query_res.rows[i]);
            }
            const data = {inventoryToppings: inventoryToppings};
            console.log(inventoryToppings);
            res.render('manager/inventory/toppingsInventory', data);
        });
});

// update toppings inventory stock
router.post('/updateToppingsStock', async (req, res) => {
  console.log('Updating toppings stock...');
  await pool.query("UPDATE inventory SET stock_level = 100 WHERE inventory_id IN (8, 9, 10, 11, 12, 13, 14, 15, 16, 17);");
  res.redirect('/manager/inventory/toppingsInventory');
});

//employee modifications
router.get('/employeeModification', (req, res) => {
    employees = []
    pool
        .query('SELECT * FROM employee;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                employees.push(query_res.rows[i]);
            }
            const data = {employees: employees};
            console.log(employees);
            res.render('manager/employeeModification', data);
        });
});

router.post('/delete', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('DELETE FROM employee WHERE employee_id = $1;', [id])
    // res.send('Employee deleted.');
    res.redirect('/manager/employeeModification');
  } catch {
    res.send('Error deleting employee.');

  }
      
});


router.post('/insert', async (req, res) => {
  const  {id, first, last} = req.body;
  if (!id || !first || !last) {
    return res.status(400).send('All fields are required.');
  }
  const check = await pool.query('SELECT 1 FROM employee WHERE employee_id = $1', [id]);

  if (check.rows.length > 0) {
    return res.status(400).send('Employee ID already exists.');
  }

  try {
    await pool.query('INSERT INTO employee VALUES($1, $2, $3);', [id, first, last])
    res.redirect('/manager/employeeModification');
  } catch (err) {
    console.error(err);
    res.send('Error inserting employee.');

  }
      
});


// Export router 
module.exports = router;
