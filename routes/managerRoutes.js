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
router.get('/index', (req, res) => {
  res.render('../index');
});

// Routes for manager pages
router.get('/managerHome', (req, res) => {
  res.render('manager/managerHome');
});

//analytics
router.get('/analytics/analyticsOptions', (req, res) => {
  res.render('manager/analytics/analyticsOptions');
});

router.get('/analytics/salesReport', async (req, res) => {
  try {
      // queries
      const { startDate2, endDate2 } = req.query;

      let query = "SELECT beverage.beverage_name, SUM(beverage.quantity) AS total_quantity, " +
                  "SUM(beverage.price * beverage.quantity)::DECIMAL(10,2) AS total_sales FROM \"order\" " +
                  "INNER JOIN beverage ON \"order\".order_id = beverage.order_id";
      
      const params = [];

      if (startDate2 && endDate2) {
        query += " WHERE \"order\".combine_date::date BETWEEN $1 AND $2";
        params.push(startDate2, endDate2);
      }

      query += " GROUP BY beverage.beverage_name ORDER BY total_sales DESC;";
      const result = await pool.query(query, params);
      const salesReportResult = result.rows;

      // render to ejs
      res.render('manager/analytics/salesReport', {
        salesReportResult,
        startDate2,
        endDate2
      });
      
    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
    }
});

router.get('/analytics/productUsageChart', (req, res) => {
    product_usage = []
    pool
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

// xreport
router.get('/analytics/xReport', async (req, res) => {
    try {
        const result = await pool.query('SELECT \n' +
            '        EXTRACT(HOUR FROM combine_date) AS hour,\n' +
            '        SUM(total_price) AS total_sales\n' +
            '      FROM "order"\n' +
            '      WHERE combine_date::date = CURRENT_DATE\n' +
            '      GROUP BY EXTRACT(HOUR FROM combine_date)\n' +
            '      ORDER BY EXTRACT(HOUR FROM combine_date);'
        );

        const dailyTotal = await pool.query('SELECT SUM(total_price) AS total_sales_today ' +
        'FROM "order" ' +
        'WHERE combine_date::date = CURRENT_DATE; '
        );

        res.render('manager/analytics/xReport', {
            hourly: result.rows,
            daily: dailyTotal.rows[0].total_sales_today
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Database error');
    }
});

router.post('/generateXReport', async (req, res) => {
    await pool.query('SELECT ' +
                            'EXTRACT(HOUR FROM combine_date) AS hour, ' +
                            'SUM(total_price) ' +
                        ' FROM "order" ' +
                        ' WHERE combine_date::date = CURRENT_DATE ' +
                        ' GROUP BY EXTRACT(HOUR FROM combine_date) ' +
                        ' ORDER BY EXTRACT(HOUR FROM combine_date);');
    res.redirect('/manager/analytics/xReport');
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
      const { startDate, endDate } = req.query;
      const peakWeekResult = await pool.query("SELECT week, SUM(total_price) AS weekly_sales FROM \"order\" " +
                                              "GROUP BY week ORDER BY weekly_sales DESC LIMIT 1;");
      const peakHourResult = await pool.query("SELECT hour, SUM(total_price) AS total_sales FROM \"order\" " +
                                              "GROUP BY hour ORDER BY total_sales DESC LIMIT 1;");
      const peakWeek = peakWeekResult.rows[0] || null;
      const peakHour = peakHourResult.rows[0] || null;
      
      let query = "SELECT B.beverage_name, COUNT(*) AS drink_count FROM \"order\" O JOIN beverage B ON O.order_id = B.order_id";
      
      const params = [];

      if (startDate && endDate) {
        query += " WHERE O.combine_date::date BETWEEN $1 AND $2";
        params.push(startDate, endDate);
      }

      query += " GROUP BY B.beverage_name ORDER BY drink_count DESC LIMIT 6";
      const listTopDrinkResult = await pool.query(query, params);
      const listTopDrink = listTopDrinkResult.rows;

      // render to ejs
      res.render('manager/analytics/orderingTrends', {
        peakWeek,
        peakHour,
        listTopDrink,
        startDate,
        endDate
      });
      
    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
    }
});

router.get('/menuModification', (req, res) => {
    beverage_info = []
    pool
        .query('SELECT * FROM beverage_info;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                beverage_info.push(query_res.rows[i]);
            }
            const data = {beverage_info: beverage_info};
            console.log(beverage_info);
            res.render('manager/menuMods/menuModification', data);
        });
    // res.render('manager/menuModification');
});

//delete menu item
router.post('/removeMenuItem', async(req, res) => {
    const{id} = req.body;
    console.log('Removing menu item... ');
    await pool.query("DELETE FROM menu_inventory WHERE beverage_info_id=$1;", [id]);
    await pool.query("DELETE FROM beverage_info WHERE beverage_info_id=$1;", [id]);

    res.redirect('/manager/menuModification');
});

//add menu item
router.post('/insertMenuItem', async(req, res) => {
    const{id, name, price, category} = req.body;
    console.log('Adding menu item... ');
    await pool.query("INSERT INTO beverage_info VALUES($1, $2, $3, $4);", [id, category, name, price]);
    // res.redirect('/manager/menuModification');

    console.log('Redirecting to edit page... ', id);
    res.redirect(`/manager/itemModification?id=${id}`);
});

//edit menu item
router.post('/updateMenuItem', async(req, res) => {
    const{id} = req.body;

    console.log('Redirecting to edit page... ', id);
    res.redirect(`/manager/itemModification?id=${id}`);
});

// page for editing menu item
router.get('/itemModification', async(req,res) => {
    const id = req.query.id;

    try {
        const result = await pool.query('SELECT * FROM beverage_info WHERE beverage_info_id = $1;', [id]);
        if (result.rows.length === 0) return res.send('No item found');
        const item = result.rows[0];

        const bev_items_res = await pool.query('SELECT\n' +
                '  bi.name AS beverage_name,\n' +
                '  inv.name AS inventory_name,\n' +
                '  mi.qt AS quantity,\n' +
                '  mi.unit AS unit\n' +
                'FROM beverage_info AS bi\n' +
                'JOIN menu_inventory AS mi\n' +
                '  ON bi.beverage_info_id = mi.beverage_info_id\n' +
                'JOIN inventory AS inv\n' +
                '  ON inv.inventory_id = mi.inventory_id\n' +
                'WHERE bi.beverage_info_id = $1;\n;', [id]);

        const bev_items = bev_items_res.rows;
        console.log('BEV ITEMS', bev_items);

        res.render('manager/itemModification', {item, bev_items});
        // res.render('manager/itemModification', { item, bev }); // EJS or another template
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

// menu inventory adding
router.post('/addToMenuItem', async(req, res) => {
    const{id, inv_id, qt, unit} = req.body;
    try {
        console.log('Adding item to the menu... ');
        await pool.query('INSERT INTO menu_inventory VALUES($1, $2, $3, $4);', [id, inv_id, qt, unit]);

        res.redirect(`/manager/itemModification?id=${id}`); //
    } catch {
        res.status(500).send('Database error');
    }
});

router.post('/removeFromMenuItem', async(req, res) => {
    const{id, inv_id} = req.body;
    try {
        console.log('Remove item from the menu... ');
        await pool.query('DELETE FROM menu_inventory WHERE beverage_info_id=$1 AND inventory_id = $2;', [id, inv_id]);

        res.redirect(`/manager/itemModification?id=${id}`);
    } catch {
        res.status(500).send('Database error');
    }
    res.render('manager/itemModification');
});



/*
app.get('/item', async (req, res) => {
  const id = req.query.id;

  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.send('No item found');
    const item = result.rows[0];
    res.render('itemPage', { item }); // EJS or another template
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});
 */

//inventory

router.get('/inventory/modifyInventory', (req, res) => {
    inventory = []
    pool
        .query('SELECT * FROM inventory;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventory.push(query_res.rows[i]);
            }
            const data = {inventory: inventory};
            console.log(inventory);
            res.render('manager/inventory/modifyInventory', data);
        });
    //display inventory
});

router.post('/inventory/addItem', async(req, res) => {
    const{id, name, stock} = req.body;
    console.log('Adding item to the inventory... ');

    await pool.query('INSERT INTO inventory VALUES($1, $2, $3);', [id, name, stock]);
    res.redirect(`/manager/inventory/modifyInventory`);
});

router.post('/inventory/deleteItem', async(req, res) => {
    const{id} = req.body;
    console.log('Remove item from the inventory... ');

    await pool.query('DELETE FROM inventory WHERE inventory_id=$1', [id]);
    res.redirect(`/manager/inventory/modifyInventory`);
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

router.get('/inventory/baseInventory', (req, res) => {
  inventoryBase = []
    pool
        .query("SELECT * FROM inventory WHERE name IN ('Blended Ice', 'Creamer', 'Lemonade');")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventoryBase.push(query_res.rows[i]);
            }
            const data = {inventory: inventoryBase};
            console.log(inventoryBase);
            res.render('manager/inventory/baseInventory', data);
        })

    // res.render('manager/inventory/baseInventory');
});

router.post('/updateBaseStock', async (req, res) => {
    console.log('Updating base stock...');
    await pool.query("UPDATE inventory SET stock_level = 100 WHERE inventory_id IN (5, 6, 7);");
    res.redirect('/manager/inventory/baseInventory');
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
        .query('SELECT * FROM employee ORDER BY employee_id ASC;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                employees.push(query_res.rows[i]);
            }
            const data = {employees: employees};
            console.log(employees);
            res.render('manager/employeeMod/employeeModification', data);
        });
});

router.post('/removeEmployee', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('DELETE FROM employee WHERE employee_id = $1;', [id])
    // res.send('Employee deleted.');
    res.redirect('/manager/employeeModification');
  } catch {
    res.send('Error deleting employee.');

  }
      
});


router.post('/insertEmployee', async (req, res) => {
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
