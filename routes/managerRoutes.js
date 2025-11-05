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


router.get('/analytics/analyticsOptions', (req, res) => {
  res.render('manager/analytics/analyticsOptions');
});

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




// Export router 
module.exports = router;
