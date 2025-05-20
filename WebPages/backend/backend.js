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

// Customer registration
app.post('/register', (req, res) => {
    const { email, first_name, surname, password, marketing } = req.body;

    if (!email || !first_name || !surname || !password) {
        return res.status(400).json({ message: 'All fields are required!' });
    }
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

        db.run("INSERT INTO users (email, user_type) VALUES (?, ?)",
            [email, 'c'], function(err2) {
                if (err2) {
                    logAction(email, 'unsuccessful register');
                    return res.status(500).json({ message: 'Error registering user: ' + err2.message });
                }
                let id;
                db.run("SELECT last_insert_rowid()", (err3, row2) => {
                    if (err3) {
                        logAction(email, 'unsuccessful register');
                        return res.status(500).json({ message: 'Database error: ' + err3.message });
                    }
                    if (row2) {
                        id = row2;
                    }
                });
                db.run("INSERT INTO customer (id, first_name, surname, password_hash, marketing) values (?,?,?,?,?)",
                    [id, first_name, surname, hashedPassword, marketing], function (err3) {
                        if (err3){
                            logAction(email, 'unsuccessful register');
                            return res.status(500).json({ message: 'Error registering user: ' + err3.message });
                        }
                    }
                )
                res.status(200).json({ message: 'User registered successfully!' });
                logAction(email, 'successful register');
            });


        db.get("SELECT * FROM marketing WHERE email = ?", [email], (err2,row2) => {
            if (err2) {
                return res.status(500).json({ message: 'Database error: ' + err2.message });
            }
            if (row2) {
                db.run("DELETE FROM marketing WHERE email = ?", [email]);
            }
        });
    });
});

// Customer login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    
    db.get("SELECT * FROM customer INNER JOIN users ON users.id = customer.id WHERE email = ? AND user_type ='c'", [email], (err, row) => {
        if (err) {
            logAction(email, 'error logging in');
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }
        
        if (!row || !bcrypt.compareSync(password, row.password_hash)) {
            logAction(email, 'Unsuccessful login');
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        
        const token = jwt.sign({ userId: row.id, email: row.email, first_name: row.first_name, last_name: row.surname }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful!', token });
        logAction(email, 'successful login');
    });
});

app.post('/cart', (req, res) => {
    const { product_no, userId } = req.body;
    let customer_id = userId;
    if (!customer_id) {
    // Step 1: Create guest user with auto-increment ID
        db.run("INSERT INTO users (user_type) VALUES ('g')", function(err) {
            if (err) {
                return res.status(500).json({ message: 'Error creating guest user', error: err.message });
            }
            customer_id = this.lastID;
        });
    }

    db.get("SELECT id FROM orders WHERE customer_id = ? AND status = 'active'", [customer_id], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'DB error finding order', error: err.message });
      }

      const insertIntoCart = (order_no) => {
        db.run("INSERT INTO cart (order_no, product_no) VALUES (?, ?)", [order_no, product_no], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error adding to cart', error: err.message });
          }
          res.status(200).json({ message: 'Item added to cart', customer_id });
        });
      };

      if (row) {
        insertIntoCart(row.order_no);
      } else {
        db.run("INSERT INTO orders (customer_id, status) VALUES (?, 'active')", [customer_id], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating order', error: err.message });
          }
          insertIntoCart(this.lastID);
        });
      }
    });



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

function getCustomerIdFromToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded.userId;
  } catch (err) {
    return null;
  }
}
