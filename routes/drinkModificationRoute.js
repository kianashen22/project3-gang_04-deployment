

const ejs = require('ejs');
const path = require('path');
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const session = require('express-session');
const axios = require('axios');
const router = express.Router();


router.post('/drinkId', async (req,res) => {
    const id = Number(req.body.drinkId);
    console.log("drink mod hit!")

        const [drink, iceLevels, sugarLevels, toppingsRaw] = await Promise.all([
            db.getDrink(id),
            db.getIceLevels(),
            db.getSugarLevels(),
            db.getToppings(),
        ]);


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
        res.json({
            success: true,
            drink,
            iceLevels,
            sugarLevels,
            toppings,
            defaults
        });
});




    

module.exports = router;  