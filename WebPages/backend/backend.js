require('dotenv').config({ path: "../../.env" });
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const db = require('./database');
const cors = require("cors");

const app = express();
const port = 3000;

//these two lines are added for now will see if they are needed for order history
app.use(cors());
app.use(express.json());

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

// 1) CREATE PRODUCT
app.post('/products', (req, res) => {
  const {
    name,
    price,
    description = '',
    stock,
    image_url,
    supplier,
    brand,
    model,
    release_year,
    specifications,
    size,
    colour = ''
  } = req.body;

  // basic validation
  if (!name || price == null || stock == null || !supplier || !brand || !model || !release_year || !specifications || !size) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const sql = `
    INSERT INTO products
      (name, price, description, stock, image_url, supplier, brand, model, release_year, specifications, size, colour)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [name, price, description, stock, image_url, supplier, brand, model, release_year, specifications, size, colour];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ message: err.message });
    // `this.lastID` is the new product's id
    res.status(201).json({
      message: 'Product created',
      product: { id: this.lastID, ...req.body }
    });
  });
});

// 2) LIST PRODUCTS
app.get('/products', (req, res) => {
  db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// ── CART HANDLERS ──

// ADD TO CART
app.post('/cart', (req, res) => {
  const { product_id, userId } = req.body;
  let customer_id = userId;

  const proceedWithOrder = () => {
    db.get("SELECT id FROM orders WHERE customer_id = ? AND status = 'active'", [customer_id], (err, row) => {
      if (err) return res.status(500).json({ message: err.message });

      const insertIntoCart = orderId => {
        db.run(
          "INSERT INTO cart (order_id, product_id, no_items) VALUES (?, ?, 1)",
          [orderId, product_id],
          function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(200).json({ message: 'Item added to cart', customer_id });
          }
        );
      };

      if (row) {
        insertIntoCart(row.id);
      } else {
        db.run("INSERT INTO orders (customer_id, status) VALUES (?, 'active')", [customer_id], function(err2) {
          if (err2) return res.status(500).json({ message: err2.message });
          insertIntoCart(this.lastID);
        });
      }
    });
  };

  if (!customer_id) {
    db.run("INSERT INTO users (user_type) VALUES ('g')", function(err) {
      if (err) return res.status(500).json({ message: err.message });
      customer_id = this.lastID;
      proceedWithOrder();
    });
  } else {
    proceedWithOrder();
  }
});

// GET CART ITEMS
app.get('/cart', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ message: 'userId is required' });

  db.get("SELECT id FROM orders WHERE customer_id = ? AND status = 'active'", [userId], (err, orderRow) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!orderRow) return res.json([]);

    db.all(`
      SELECT
        c.product_id,
        c.no_items,
        p.name,
        p.price,
        p.image_url
      FROM cart c
      JOIN products p ON p.id = c.product_id
      WHERE c.order_id = ?
    `, [orderRow.id], (err2, rows) => {
      if (err2) return res.status(500).json({ message: err2.message });
      res.json(rows);
    });
  });
});

// REMOVE ITEM FROM CART
app.delete('/cart', (req, res) => {
  const { product_id, userId } = req.body;
  if (!product_id || !userId) {
    return res.status(400).json({ message: 'product_id and userId are required' });
  }

  db.get("SELECT id FROM orders WHERE customer_id = ? AND status = 'active'", [userId], (err, orderRow) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!orderRow) return res.status(404).json({ message: 'No active cart found' });

    db.run("DELETE FROM cart WHERE order_id = ? AND product_id = ?", [orderRow.id, product_id], function(err2) {
      if (err2) return res.status(500).json({ message: err2.message });
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }
      res.json({ message: 'Item removed' });
    });
  });
});

// SAVE ORDER: Finalize the active order and mark it as completed
app.post('/update-cart', (req, res) => {
    console.log('Received request on /update-cart with body:', req.body);
    const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  db.get("SELECT id FROM orders WHERE customer_id = ? AND status = 'active'", [userId], (err, orderRow) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!orderRow) return res.status(404).json({ message: 'No active cart found' });

    db.run("UPDATE orders SET status = 'completed', order_date = datetime('now') WHERE id = ?", [orderRow.id], function(err2) {
      if (err2) return res.status(500).json({ message: err2.message });
      res.json({ message: 'Order finalized and saved successfully!' });
    });
  });
});


// GET ORDER HISTORY
app.get('/order-history', (req, res) => {
  const userId = req.query.userId;

  if (!userId) return res.status(400).json({ message: 'userId is required' });

  db.all(`
    SELECT 
      o.id AS order_id,
      o.status,
      o.order_date,
      c.product_id,
      c.no_items,
      p.name,
      p.price,
      p.image_url
    FROM orders o
    JOIN cart c ON o.id = c.order_id
    JOIN products p ON p.id = c.product_id
    WHERE o.customer_id = ? AND o.status != 'active'
    ORDER BY o.order_date DESC
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    const orders = {};
    for (const row of rows) {
      if (!orders[row.order_id]) {
        orders[row.order_id] = {
          order_id: row.order_id,
          status: row.status,
          order_date: row.order_date,
          items: [],
        };
      }
      orders[row.order_id].items.push({
        product_id: row.product_id,
        name: row.name,
        price: row.price,
        image_url: row.image_url,
        quantity: row.no_items,
      });
    }

    res.json(Object.values(orders));
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
