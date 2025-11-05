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
        .query('SELECT COUNT(*) AS drink_count, SUM(I.qt) AS quantity, Y.name AS item_name, COUNT(*) * SUM(I.qt) AS total_quantity FROM beverage B JOIN "order" O ON O.order_id = B.order_id JOIN menu_inventory I ON I.beverage_info_id = B.beverage_info_id JOIN inventory Y ON I.inventory_id = Y.inventory_id GROUP BY Y.name ORDER BY total_quantity DESC')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                product_usage.push(query_res.rows[i]);
            }
            const data = {product_usage: product_usage};
            console.log(product_usage);
            res.render('manager/analytics/productUsageChart', data);
        });
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
  res.render('manager/inventory/teaInventory');
});

router.get('/inventory/disposablesInventory', (req, res) => {
  res.render('manager/inventory/disposablesInventory');
});

router.get('/inventory/toppingsInventory', (req, res) => {
  inventoryToppings = []
    pool
        .query("SELECT inventory_id, name, stock_level FROM inventory WHERE name IN ('Coffee Jelly', 'Lychee Jelly', 'Tapioca Pearl', 'Thai powder', 'Taro powder', 'Peach', 'Honey', 'Mango', 'Passionfruit', 'Ice cream');")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventoryToppings.push(query_res.rows[i]);
            }
            const data = {inventoryToppings: inventoryToppings};
            console.log(inventoryToppings);
            res.render('manager/inventory/toppingsInventory', data);
        });
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
