require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');  // Import your SQLite database setup

const app = express();
app.use(cors({ origin: 'http://localhost:5000' })); // Allow Flask (Frontend)
app.use(bodyParser.json());  // Parse JSON data

const SECRET_KEY = "your_secret_key";  // Use environment variable for production

// User registration endpoint
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
        [username, email, hashedPassword], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "User registered successfully" });
    });
});

// User login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err || !user) return res.status(401).json({ message: "User not found" });

        if (!bcrypt.compareSync(password, user.password_hash))
            return res.status(401).json({ message: "Invalid password" });

        const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: "Login successful", token });
    });
});

// Get all products
app.get('/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Start backend server
app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
