
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const axios = require('axios');

const session = require("express-session");
const { OAuth2Client } = require("google-auth-library");

// Create express app
const app = express();
const port = 3000;

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

// Create OAuth Client
const redirectUrl = process.env.GOOGLE_REDIRECT_URI;
const oauth2Client = new OAuth2Client({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

// Create Session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

    })
);

app.set("view engine", "ejs");

// let any files in public folder to be accesible, so that browser can access it
app.use(express.static('public'));



// Import route files
const managerRoutes = require('./routes/managerRoutes');
const customerRoutes = require('./routes/customerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const audioRoutes = require("./routes/audioRoutes");
const orderRoutes = require("./routes/orderRoutes");
const drinkModificationRoute = require("./routes/drinkModificationRoute");



// Mount them with base paths
app.use('/manager', requireManager, managerRoutes);
app.use('/employee', requireEmployee, employeeRoutes);
app.use('/customer', customerRoutes);
app.use("/api", audioRoutes);
app.use("/api", orderRoutes);
app.use('/', drinkModificationRoute);

app.get('/', async(req, res) => {
    const user = req.session.user; 

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
    res.render('index', { user: user, weather: data });
});

// Google Login
app.get('/auth/google', (req, res) => {
    const role = req.query.role;
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["openid", "profile", "email"],
        prompt: "select_account",
        state: role 
    });

    res.redirect(url);
});


app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    const role = req.query.state;
    console.log("Role from state:", role);

    try {

        const { tokens } = await oauth2Client.getToken(code);

        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });


        const user = ticket.getPayload();
        console.log("Google User:", user);

        //reroute based on role
        let tableName;
        let redirectUrl;

        if (role === 'manager') {
            tableName = 'managerlogin';
            redirectUrl = '/manager/managerHome';
        } else if (role === 'employee') {
            tableName = 'employee';
            redirectUrl = '/employee/employeeHome';
        } else {
            tableName = 'customer';
            redirectUrl = '/customer/customerOrder';
        }
        console.log("Using table:", tableName);
        console.log("Redirecting to:", redirectUrl);

        // VERIFY USER IN MANGAGER TABLE
        const result = await pool.query(
            `SELECT * FROM ${tableName} WHERE email = $1`,
            [user.email]
        );

        console.log("Database query result:", result);  
        //no user found found
        if (result.rowCount === 0) {
            console.log("No user found with email:", user.email);  
            return res.redirect('/'); // TODO: create a page that indicates that access was denied
        }
        console.log("session info:", result.rows[0].email, result.rows[0].name ||result.rows[0].first_name)
        // saves user
        req.session.user = {
            email: result.rows[0].email,
            name: result.rows[0].name ||result.rows[0].first_name,
            id: result.rows[0].customer_id || result.rows[0].id || result.rows[0].employee_id,
            role: role
        };
        res.redirect(redirectUrl);    

    } catch (err) {
        console.error("OAuth Error", err);
        res.redirect('/');  // TODO: create a page that indicates that access was denied
    }
});


// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.get('/customerLogout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/customer/customerHome');
    });
});

// LOGINT OUT --> END SESSION
app.post('/customerLogout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.redirect('/customer/customerOrder');
    }

    res.clearCookie('connect.sid');
    res.redirect('/customer/customerHome');
  });
});


// function to require manager to be loged in
function requireManager(req, res, next) {
    if (!req.session.user) return res.redirect('/auth/google');
    if (req.session.user.role !== 'manager')
        return res.status(403).send('Not a manager, Access denied');
    next();
}

function requireEmployee(req, res, next) {
    if (!req.session.user) return res.redirect('/auth/google');
    if (req.session.user.role !== 'employee')
        if (req.session.user.role !== 'manager')
            return res.status(403).send('Not an employee, Access denied');
    next();
}




// app.get('/index', (req, res) => {
//     res.render('index', { user: req.session.user || null });
// });

app.get('/index', async(req, res) => {
    const user = req.session.user; 

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
    res.render('index', { user: user, weather: data });
});



app.get('/menu', async(req, res) => {
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
                res.render('menu', {
                user: user,
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

        res.render('menu', { 
            user: user,
            weather: null,
            error: 'Error fetching weather.',
        });
    }
});





module.exports = { app, pool };


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
