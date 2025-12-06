
const ejs = require('ejs');
const path = require('path');
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const session = require('express-session');
const axios = require('axios');

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
    ssl: {rejectUnauthorized: false}
});

// Add process hook to shutdown pool
process.on('SIGINT', function() {
    pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});


// POST /api/confirm-order
router.post("/confirm-order", async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No items found in order.",
            });
        }

        const savedItems = [];

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
        const totalPrice = items[0].totalPrice;

        const orderResult = await pool.query(
        `INSERT INTO "order" (
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
                    [customerId, totalPrice]
                );
            
        // associate orderID for drinks
        const orderId = orderResult.rows[0].order_id;

        // Get next beverage_id
        const maxResult = await pool.query(
            'SELECT COALESCE(MAX(beverage_id), 0) AS max_id FROM beverage'
        );
        let nextBeverageId = maxResult.rows[0].max_id + 1;

        for (const item of items) {
            const result = await pool.query(
                `INSERT INTO beverage
                 (beverage_id, order_id, beverage_info_id, beverage_name, quantity, ice_level, sweetness_level, size, price)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [
                    nextBeverageId,
                    orderId,
                    item.drinkID,
                    item.drinkName,
                    item.quantity,
                    item.iceLevel,
                    item.sweetnessLevel,
                    item.size,
                    item.drinkPrice
                ]
            );

            savedItems.push(result.rows[0]);

            // DECREASE INVENTORY
        }

        res.json({
            success: true,
            orderId
        });

    } catch (err) {
        console.error("Error saving order:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error while saving order."
        });
    }
});

module.exports = router;  

