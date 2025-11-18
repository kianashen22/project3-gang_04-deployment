
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

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


// Mount them with base paths
app.use('/manager', requireManager, managerRoutes);
app.use('/employee', requireEmployee, employeeRoutes);
app.use('/customer', customerRoutes);

app.get('/', (req, res) => {
    // Example: if you are using sessions
    const user = req.session.user; // or however you store the logged-in user
    res.render('index', { user: user });
});

// Google Login
app.get('/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["openid", "profile", "email"],
        prompt: "select_account"
    });

    res.redirect(url);
});


app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;

    try {

        const { tokens } = await oauth2Client.getToken(code);

        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });


        const user = ticket.getPayload();

        // VERIFY USER IN MANGAGER TABLE
        const result = await pool.query(
            'SELECT * FROM managerlogin WHERE email = $1',
            [user.email]
        );
        //no manager found
        if (result.rowCount === 0) {
            const result = await pool.query(
                'SELECT * FROM employee WHERE email = $1',
                [user.email]
            );

            if (result.rowCount === 0) {
                return res.status(403).send('Access denied: not an authorized manager');
            }

            req.session.user = {
                email: result.rows[0].email,
                name: result.rows[0].name,
                role: 'employee'
            };
            res.redirect('/employee/employeeHome');    

        } else {
            // saves user
            req.session.user = {
                email: result.rows[0].email,
                name: result.rows[0].name,
                role: 'manager'
            };
            res.redirect('/manager/managerHome');    
        }

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




app.get('/index', (req, res) => {
    res.render('index', { user: req.session.user || null });
});



app.get('/menu', (req, res) => {
    beverage_info = []
    pool
        .query('SELECT * FROM beverage_info;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                beverage_info.push(query_res.rows[i]);
            }
            const data = {beverage_info: beverage_info};
            console.log(beverage_info);
            res.render('menu', data);
        });
});



app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
