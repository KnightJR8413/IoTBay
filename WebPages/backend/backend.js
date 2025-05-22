require('dotenv').config({ path: "../../.env" });
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const db = require('./database');
const cors = require("cors");
const authenticateToken = require('./authenticateToken');

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

//helpers for getting users
const getALLAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Middleware
app.use(bodyParser.json()); // finding in forms
app.use(cors()); // allowing request through

// Customer registration
app.post('/register', (req, res) => {
    const { email, first_name, last_name, password, marketing } = req.body;

    if (!email || !first_name || !last_name || !password) {
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
                db.run("INSERT INTO customer (id, first_name, last_name, password_hash, marketing) values (?,?,?,?,?)",
                    [id, first_name, last_name, hashedPassword, marketing], function (err3) {
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
    
    //CHECKING IF THEY'RE THE ADMIN
    if (email.toLowerCase() == "admin@iotbay.com") {
      if (!bcrypt.compareSync(password, "$2a$12$4dffGL/MnFj5ch0oYF50QO4ZyajjHAlOzhw5ve93wVs4rDtR8vxq2")) {
          logAction(email, 'Unsuccessful login');
          return res.status(401).json({ message: 'Invalid email or password.' });
      }
      
      db.get("SELECT * FROM staff INNER JOIN users ON users.id = staff.id WHERE email = ?", [email], (err, adminRow) => {
        if (err) {
            logAction(email, 'error logging in');
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }

        if (!adminRow) {
            logAction(email, 'Unsuccessful login');
            return res.status(404).json({ message: 'Admin record not found.' });
        }

        const token = jwt.sign({ userId: adminRow.id, email: adminRow.email, first_name: adminRow.first_name, last_name: adminRow.last_name, user_type: adminRow.user_type, role: "admin" }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful!', token });
        logAction(email, 'login');
      });
      return;
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
        
        const token = jwt.sign({ userId: row.id, email: row.email, first_name: row.first_name, last_name: row.last_name }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful!', token });
        logAction(email, 'login');
    });
});

app.post('/update-customer', authenticateToken, async (req, res) => {
    const { first_name, last_name, email, address_line_1, address_line_2, phone_no } = req.body;
    const userId = req.user.userId; 

    try {
        await db.run("UPDATE users SET email = ? WHERE id = ?", [email, userId]);
        await db.run("UPDATE customer SET first_name = ?, last_name = ?, phone_no = ?, address_line_1 = ?, address_line_2 = ? WHERE id = ?",
            [first_name, last_name, phone_no, address_line_1, address_line_2, userId]);

        res.json({ message: 'User and customer info updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update user info" });
    }
});

app.get('/user-details', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await getAsync('SELECT email FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let details;
    // Check the role from the token—if it's admin, query the staff table.
    if (req.user.role && req.user.role === 'admin') {
      details = await getAsync(`
        SELECT first_name, last_name, phone_no
        FROM staff
        WHERE id = ?
      `, [userId]);
    } else {
      // Otherwise, assume customer and query the customer table.
      details = await getAsync(`
        SELECT first_name, last_name, phone_no, address_line_1, address_line_2
        FROM customer
        WHERE id = ?
      `, [userId]);
    }

    if (!details) {
      return res.status(404).json({ error: 'User details not found' });
    }

    res.json({
      email: user.email,
      ...details
    });
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/user-logs', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const logs = await getAsync(
      'SELECT type, date FROM user_logs WHERE user_id = ? AND (type = "login" OR type = "logout") ORDER BY date DESC',
      [userId]
    );

    res.json(logs);
  } catch (err) {
    console.error('Error fetching user logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/delete-account', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    function runAsync(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);  // `this` is the statement context, e.g. lastID, changes
            });
        });
    }

    try {
        // Delete logs, customer, and user record
        await runAsync(db, `
            UPDATE users
            SET email = NULL,
                user_type = 'd'
            WHERE id = ?;
        `, [userId]);

        await runAsync(db, `
            UPDATE customer
            SET first_name = NULL,
                last_name = NULL,
                address_line_1 = NULL,
                address_line_2 = NULL,
                password_hash = NULL,
                marketing = NULL,
                phone_no = NULL
            WHERE id = ?;
        `, [userId]);

        res.json({ message: "Account deleted successfully." });
    } catch (err) {
        console.error("Error deleting account:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

//ADMIN USER STUFF

// GETTING USERS FOR ADMIN
app.get("/admin/users", authenticateToken, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    logAction(req.user ? req.user.email : "unknown", 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  try {
    const searchParam = req.query.search ? `%${req.query.search}%` : '%';

     const customersSql = `
      SELECT 
        u.id as userId, 
        u.email,
        (c.first_name || ' ' || c.last_name) AS full_name,
        c.phone_no AS phone, 
        u.user_type, 
        u.status
      FROM users u
      INNER JOIN customer c ON u.id = c.id
      WHERE u.user_type = 'c'
        AND (
          u.email LIKE ?
          OR c.first_name LIKE ?
          OR c.last_name LIKE ?
          OR c.phone_no LIKE ?
        )
    `;

    const staffSql = `
      SELECT 
        u.id as userId, 
        u.email,
        (s.first_name || ' ' || s.last_name) AS full_name,
        '' AS phone, 
        u.user_type, 
        u.status
      FROM users u
      INNER JOIN staff s ON u.id = s.id
      WHERE u.user_type = 'staff'
        AND (
          u.email LIKE ?
          OR s.first_name LIKE ?
          OR s.last_name LIKE ?
        )
    `;

    const customerParams = [searchParam, searchParam, searchParam, searchParam];
    const staffParams = [searchParam, searchParam, searchParam];
    const customers = await getALLAsync(customersSql, customerParams);
    const staff     = await getALLAsync(staffSql, staffParams);

    const users = customers.concat(staff);
    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GETTING SPECIFIC USER DETAILS
app.get('/admin/users/:id', authenticateToken, async (req, res) => {
  if (!req.user || req.user.role != 'admin') {
    logAction(email, 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  const userId = req.params.id;
  try {
    const query = `
      SELECT u.id as userId, u.email,
          COALESCE(c.first_name || ' ' || c.last_name, s.first_name || ' ' || s.last_name) AS full_name,
          COALESCE(c.phone_no, '') as phone,
          u.user_type, 'active' as status
      FROM users u
      LEFT JOIN customer c ON u.id = c.id
      LEFT JOIN staff s ON u.id = s.id
      WHERE u.id = ?
    `;
    const user = await getAsync(query, [userId]);
    if (!user) {
      logAction(email, 'User not found');
      return res.status(404).json({ message: 'User not found.'});
    }
    res.json({ user });
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ error: 'Internal server error'});
  }
});

// CREATE USER
app.post('/admin/users', authenticateToken, async (req, res) => {
  if (!req.user || req.user.role != 'admin') {
    logAction(email, 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  const { full_name, email, phone, user_type } = req.body;
  const names = full_name.split(' ');
  const first_name = names[0];
  const last_name = names.slice(1).join(' ') || '';

  //Insert into users table
  db.run(
    "INSERT INTO users (email, user_type) VALUES (?, ?)",
    [email, user_type],
    function (err) {
      if (err) return res.status(500).json({ error: "Database error: " + err.message });
      const newUserId = this.lastID;
      if (user_type == 'c') {
        // Setting a default password
        const defaultPasswordHash = bcrypt.hashSync('default123', 10);
        db.run(
          "INSERT INTO customer (id, first_name, last_name, phone_no, password_hash) VALUES (?, ?, ?, ?, ?)",
          [newUserId, first_name, last_name, phone, defaultPasswordHash],
          (err) => {
            if (err) return res.status(500).json({ error: "Database error: " + err.message });
            res.json({ message: 'Customer created', userId: newUserId });
          }
        );
      } else if (user_type == 'staff') {
        const defaultPasswordHash = bcrypt.hashSync('default123', 10);
        db.run(
          "INSERT INTO staff (id, first_name, last_name, password_hash) VALUES (?, ?, ?, ?)",
          [newUserId, first_name, last_name, defaultPasswordHash],
          (err) => {
            if (err) return res.status(500).json({ error: "Database error: " + err.message });
            res.json({ message: 'Staff created', userId: newUserId });
          }
        );
      } else {
        res.status(400).json({ error: 'Invalid user type' });
      }
    }
  );
});

// UPDATING USER DETAILS
app.put('/admin/users/:id', authenticateToken, async (req, res) => {
  if (!req.user || req.user.role != 'admin') {
    logAction(email, 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  const userId = req.params.id;
  const { full_name, email, phone, user_type } = req.body;
  const names = full_name.split(' ');
  const first_name = names[0];
  const last_name = names.slice(1).join(' ') || '';

  db.run(
    "UPDATE users SET email = ?, user_type = ? WHERE id = ?",
    [email, user_type, userId],
    function (err) {
      if (err) return res.status(500).json({ error: "Database error: " + err.message });
      if (user_type == 'c') {
        db.run(
          "UPDATE customer SET first_name = ?, last_name = ?, phone_no = ? WHERE id = ?",
          [first_name, last_name, phone, userId],
          function (err) {
            if (err) return res.status(500).json({ error: "Database error: " + err.message });
            res.json({ message: 'Customer updated' });
          }
        );
      } else if (user_type == 'staff') {
        db.run(
          "UPDATE staff SET first_name = ?, last_name = ? WHERE id = ?",
          [first_name, last_name, userId],
          function (err) {
            if (err) return res.status(500).json({ error: "Database error: " + err.message });
            res.json({ message: 'Staff updated' });
          }
        );
      } else {
        res.status(400).json({ error: 'Invalid user type' });
      }
    }
  );
});

// TOGGLING USER STATUS (active/inactive)
app.put('/admin/users/:id/status', authenticateToken, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    logAction(req.user ? req.user.email : "unknown", 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  const userId = req.params.id;
  const { status } = req.body; 

  try {
    const user = await getAsync("SELECT email FROM users WHERE id = ?", [userId]);
    if (user && user.email.toLowerCase() === "admin@iotbay.com") {
      return res.status(403).json({ error: "Admin status cannot be changed." });
    }
    
    db.run("UPDATE users SET status = ? WHERE id = ?", [status, userId], function (err) {
      if (err) return res.status(500).json({ error: "Database error: " + err.message });
      res.json({ message: 'Status updated.' });
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.delete('/admin/users/:id', authenticateToken, async (req, res) => {
  if (!req.user || req.user.role != 'admin') {
    logAction(email, 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  const userId = req.params.id;
  
  try {
    //Getting the type of user after checking whether they exist or not
    const user = await getAsync("SELECT user_type FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.user_type == 'c') {
      await getAsync("DELETE FROM customer WHERE id = ?", [userId]);
    } else if (user.user_type == 'staff') {
      await getAsync("DELETE FROM staff WHERE id = ?", [userId]);
    }

    //After the user is deleted from their specific table, they are deleted from the overall users table
    await getAsync("DELETE FROM users WHERE id = ?", [userId]);

    res.json({ messsage: 'User records deleted successfully from all necessary tables'});
  } catch (error) {
    console.error('Error deleting user: ', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//END ADMIN USER STUFF

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

// CANCEL / DELETE AN ORDER
app.delete('/orders/:id', (req, res) => {
  const userId  = req.body.userId;
  const orderId = parseInt(req.params.id, 10);

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  // ensure that order belongs to this user
  db.get(
    "SELECT id FROM orders WHERE id = ? AND customer_id = ? AND status != 'active'",
    [orderId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(404).json({ message: 'Order not found or cannot be cancelled' });

      // delete the cart items
      db.run("DELETE FROM cart WHERE order_id = ?", [orderId], function(err2) {
        if (err2) return res.status(500).json({ message: err2.message });

        // delete the order itself
        db.run("DELETE FROM orders WHERE id = ?", [orderId], function(err3) {
          if (err3) return res.status(500).json({ message: err3.message });
          res.json({ message: 'Order cancelled successfully' });
        });
      });
    }
  );
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
