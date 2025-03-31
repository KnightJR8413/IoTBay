require('dotenv').config({ path: "../../.env" });
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const db = require('./database');
const cors = require("cors");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json()); // finding in forms
app.use(cors()); // allowing request through

// User registration
app.post('/register', (req, res) => {
    const { email, first_name, surname, password, marketing } = req.body;

    if (!email || !first_name || !surname || !password) {
        return res.status(400).json({ message: 'All fields are required!' });
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
    });
});

// User login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }

        if (!row || !bcrypt.compareSync(password, row.password_hash)) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign({ userId: row.id, email: row.email }, process.env.SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful!', token });
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
app.post("/logout", (res) => {
    res.json({ message: "Logout successful. Clear token on client-side." });
});

// Start server
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
