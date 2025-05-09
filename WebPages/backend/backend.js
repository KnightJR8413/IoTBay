require('dotenv').config({ path: "../../.env" });
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const db = require('./database');
const cors = require("cors");

const app = express();
const port = 3000;

// Loads secret key and makes sure it exists
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    console.error("Error: SECRET_KEY is not defined in .env file!");
    process.exit(1);
}


// Middleware
app.use(bodyParser.json()); // finding in forms
app.use(cors()); // allowing request through

// User registration
app.post('/register', (req, res) => {
    const { email, first_name, surname, password, marketing } = req.body;

    if (!email || !first_name || !surname || !password) {
        return res.status(400).json({ message: 'All fields are required!' });
    }
    console.log(marketing);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)){
        return res.status(400).json({ message: 'Please enter a valid email'});
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }

        if (row) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        db.run("INSERT INTO users (email, first_name, surname, password_hash, marketing) VALUES (?, ?, ?, ?, ?)",
            [email, first_name, surname, hashedPassword, marketing], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Error registering user: ' + err.message });
                }
                res.status(200).json({ message: 'User registered successfully!' });
            });

        db.get("SELECT * FROM marketing WHERE email = ?", [email], (err,row) => {
            if (err) {
                return res.status(500).json({ message: 'Database error: ' + err.message });
            }
            if (row) {
                db.run("DELETE FROM marketing WHERE email = ?", [email]);
            }
        });
        logAction(email, 'register');
    });
});

// User login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    logAction(email, 'login');

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }

        if (!row || !bcrypt.compareSync(password, row.password_hash)) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign({ userId: row.id, email: row.email, first_name: row.first_name, last_name: row.surname }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful!', token });
    });
});

app.post('/cart', (req, res) => {
    const { product_no, customer_id } = req.body;

    // if no customer_id, create temp ID 
    // check active order for cutomer ID
    // if no order create order




    db.run("INSERT INTO cart (order_no, product_no) VALUES (?, ?)",
            [order_no, product_no], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Error adding item to cart: ' + err.message });
                }
                res.status(200).json({ message: 'item added successfully' });
            });
});

app.post('/newsletter', (req,res) => {
    const { email } = req.body;
    db.get("SELECT * FROM marketing WHERE email = ?", [email], (err,row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }

        if (row) {
            return res.status(401).json({ message: 'Email already on mailing list'})
        }
        db.get("SELECT * FROM users WHERE email = ?", [email], (err, rowU) => {
            if (err) {
                return res.status(500).json({ message: 'Database error: ' + err.message });
            }
            if (rowU) {
                if (rowU.marketing === 'off') {
                    db.run("UPDATE users SET marketing WHERE email = ?", [email]);
                    logAction(email, 'newletter');
                    res.status(200).json({ message: email + ' marketing preferences have be changed'});
                } else if (rowU.marketing === 'on') {
                    logAction(email, 'newletter');
                    res.status(401).json({ message: 'Email on mailing list'});
                } 
            } else {
                db.run("INSERT INTO marketing (email) VALUES (?)", [email]);
                logAction(email, 'newletter');
                res.status(200).json({ message: email + ' added to mailing list'});
            }
        });
    });
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Token is invalid or expired." });
        }
        req.user = user;
        next();
    });
}

// Check Login Status (for session persistence)
app.get("/check-session", authenticateToken, (req, res) => {
    res.json({ user: req.user.email });
});

// Check Login Status (for session persistence)
app.post("/logout", (req, res) => {
    const {email} = req.body;
    logAction(email, 'logout');
    res.json({ message: "Logout successful. Clear token on client-side." });
});

// Start server
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});

function logAction(email, type) {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }
        if (row) {
            const id = row.id;
            db.run("INSERT INTO user_logs (user_id, type) VALUES (?, ?)",[id, type]);
        }
    });
    console.log(type + ' logged in database');
}