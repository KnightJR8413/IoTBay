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

// login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await getAsync("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      logAction(email, 'Unsuccessful login - user not found');
      return res.status(401).json({ message: "Invalid email or password." });
    }

    //Checks if the users account is deactived and stops them from logging in if they are.
    if (user.status.toLowerCase() !== 'active') {
      logAction(email, 'Unsuccessful login - User account deactivated');
      return res.status(403).json({ message: "Your account has been deactivated."});
    }

    let row;
    if (user.user_type === 'c') {
      row = await getAsync(
        "SELECT * FROM users INNER JOIN customer ON users.id = customer.id WHERE email = ?",
        [email]
      );
    } else if (user.user_type === 's' || user.user_type === 'a') {
      row = await getAsync(
        "SELECT * FROM users INNER JOIN staff ON users.id = staff.id WHERE email = ?",
        [email]
      );
    }
    console.log("Entered password:", password);
    console.log("Password hash:", row?.password_hash);
    console.log("Stored hash:", JSON.stringify(row.password_hash));
    console.log('Row for login:', row, bcrypt.compareSync(password, row.password_hash));
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      logAction(email, 'Unsuccessful login - wrong password');
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      {
        userId: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        user_type: row.user_type
      },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    logAction(email, 'login');
    return res.status(200).json({ message: 'Login successful!', token });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Check Login Status 
app.get("/check-session", authenticateToken, (req, res) => {
    res.json({ user: req.user.email });
});

// Logs logout
app.post("/logout", (req, res) => {
    const {email} = req.body;
    logAction(email, 'logout');
    res.json({ message: "Logout successful. Clear token on client-side." });
});

// updates customer details from /account page
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

// gets user details
app.get('/user-details', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await getAsync('SELECT email FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let details;
    // Check the role from the token—if it's admin or staff, query the staff table.
    if (req.user.user_type  === 'a' || req.user.user_type  === 's') {
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

// gets user logs
app.get('/user-logs', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const logs = await getALLAsync(
      'SELECT type, date FROM user_logs WHERE user_id = ? AND (type = "login" OR type = "logout") ORDER BY date DESC',
      [userId]
    );

    res.json(logs);
  } catch (err) {
    console.error('Error fetching user logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// sets all user values except id to null
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
  if (!req.user || req.user.user_type !== 'a') {
    logAction(req.user ? req.user.email : "unknown", 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  try {
    const searchParam = req.query.search ? `%${req.query.search}%` : '%';

    const sql = `
      SELECT 
        u.id AS userId, 
        u.email,
        COALESCE(c.first_name, s.first_name) || ' ' || COALESCE(c.last_name, s.last_name) AS full_name,
        COALESCE(c.phone_no, s.phone_no, '') AS phone,
        u.user_type, 
        u.status
      FROM users u
      LEFT JOIN customer c ON u.id = c.id
      LEFT JOIN staff s ON u.id = s.id
      WHERE (u.user_type = 'c' OR u.user_type = 's')
        AND (
          u.email LIKE ?
          OR COALESCE(c.first_name, s.first_name) LIKE ?
          OR COALESCE(c.last_name, s.last_name) LIKE ?
          OR COALESCE(c.phone_no, s.phone_no) LIKE ?
        )
    `;


    const params = [searchParam, searchParam, searchParam, searchParam];
    const users = await getALLAsync(sql, params);

    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GETTING SPECIFIC USER DETAILS
app.get('/admin/users/:id', authenticateToken, async (req, res) => {
  if (!req.user || req.user.user_type !== 'a') {
    logAction(req.user ? req.user.email : "unknown", 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  const userId = req.params.id;
  try {
    const query = `
      SELECT u.id as userId, u.email,
          COALESCE(c.first_name || ' ' || c.last_name, s.first_name || ' ' || s.last_name) AS full_name,
          COALESCE(c.phone_no, s.phone_no, '') as phone,
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
  if (!req.user || req.user.user_type !== 'a') {
    logAction(req.user ? req.user.email : "unknown", 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  const { full_name, email, phone, user_type, status } = req.body;
  const names = full_name.split(' ');
  const first_name = names[0];
  const last_name = names.slice(1).join(' ') || '';

  //Insert into users table
  db.run(
    "INSERT INTO users (email, user_type, status) VALUES (?, ?, ?)",
    [email, user_type, status],
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
      } else if (user_type == 's') {
        const defaultPasswordHash = bcrypt.hashSync('default123', 10);
        db.run(
          "INSERT INTO staff (id, first_name, last_name, phone_no, password_hash) VALUES (?, ?, ?, ?, ?)",
          [newUserId, first_name, last_name, phone, defaultPasswordHash],
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

  if (!req.user || req.user.user_type !== 'a') {
    logAction(req.user ? req.user.email : "unknown", 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  const userId = req.params.id;
  const { full_name, email, phone, user_type, status } = req.body;
  const names = full_name.split(' ');
  const first_name = names[0];
  const last_name = names.slice(1).join(' ') || '';

  db.run(
    "UPDATE users SET email = ?, user_type = ?, status = ? WHERE id = ?",
    [email, user_type, status, userId],
    function (err) {
      if (err) return res.status(500).json({ error: "Database error: " + err.message });
      if (user_type === 'c') {
        db.run(
          "UPDATE customer SET first_name = ?, last_name = ?, phone_no = ? WHERE id = ?",
          [first_name, last_name, phone, userId],
          function (err) {
            if (err) return res.status(500).json({ error: "Database error: " + err.message });
            res.json({ message: 'Customer updated' });
          }
        );
      } else if (user_type === 's') {
        db.run(
          "UPDATE staff SET first_name = ?, last_name = ?, phone_no = ? WHERE id = ?",
          [first_name, last_name, phone, userId],
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
  if (!req.user || req.user.user_type !== 'a') {
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
  if (!req.user || req.user.user_type !== 'a') {
    logAction(req.user ? req.user.email : "unknown", 'Unauthorised Access');
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  const userId = req.params.id;
  
  try {
    //Getting the type of user after checking whether they exist or not
    const user = await getAsync("SELECT user_type FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.user_type == 'c') {
      await getAsync("DELETE FROM customer WHERE id = ?", [userId]);
    } else if (user.user_type == 's') {
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
  const nameFilter = req.query.name;

  if (nameFilter) {
    db.all("SELECT * FROM products WHERE name LIKE ? ORDER BY id DESC", [`%${nameFilter}%`], (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    });
  } else {
    db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    });
  }
});

// 3) UPDATE PRODUCT
app.put('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const {
    name, price, description = '',
    stock, image_url = '', supplier,
    brand, model, release_year,
    specifications, size, colour = ''
  } = req.body;

  const sql = `
    UPDATE products
       SET name=?, price=?, description=?, stock=?,
           image_url=?, supplier=?, brand=?, model=?,
           release_year=?, specifications=?, size=?, colour=?
     WHERE id=?
  `;
  const params = [
    name, price, description, stock,
    image_url, supplier, brand, model,
    release_year, specifications, size, colour,
    id
  ];
  db.run(sql, params, function(err) {
    if (err)   return res.status(500).json({ message: err.message });
    if (this.changes === 0) 
               return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated', id, ...req.body });
  });
});

// 4) DELETE PRODUCT
app.delete('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  db.run('DELETE FROM products WHERE id=?', [id], function(err) {
    if (err)   return res.status(500).json({ message: err.message });
    if (this.changes === 0) 
               return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted', id });
  });
});

// 5) GET SINGLE PRODUCT
app.get('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err)   return res.status(500).json({ message: err.message });
    if (!row)  return res.status(404).json({ message: 'Not found' });
    res.json(row);
  });
});

// SHOPPING CART SECTION START
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

// SAVE ORDER
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
// SHOPPING CART SECTION END

// ORDER HISTORY AND ORDER DETAILS SECTION START
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
    ORDER BY o.order_date DESC, o.id, c.product_id
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    const ordersMap = new Map();

    for (const row of rows) {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          status: row.status,
          order_date: row.order_date,
          items: []
        });
      }
      ordersMap.get(row.order_id).items.push({
        product_id: row.product_id,
        no_items: row.no_items,
        name: row.name,
        price: row.price,
        image_url: row.image_url
      });
    }

    const orders = Array.from(ordersMap.values());

    res.json(orders);
  });
});

// GET ITEMS FOR A SPECIFIC ORDER
app.get('/orders/:orderId/items', (req, res) => {
  const orderId = req.params.orderId;

  db.all(`
    SELECT product_id, no_items
    FROM cart
    WHERE order_id = ?
  `, [orderId], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows || []);
  });
});

// CANCEL / DELETE AN ORDER
app.delete('/orders/:id', (req, res) => {
  const userId  = req.body.userId;
  const orderId = parseInt(req.params.id, 10);

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  db.get(
    "SELECT id FROM orders WHERE id = ? AND customer_id = ? AND status != 'active'",
    [orderId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(404).json({ message: 'Order not found or cannot be cancelled' });

      db.run("DELETE FROM cart WHERE order_id = ?", [orderId], function(err2) {
        if (err2) return res.status(500).json({ message: err2.message });

        db.run("DELETE FROM orders WHERE id = ?", [orderId], function(err3) {
          if (err3) return res.status(500).json({ message: err3.message });
          res.json({ message: 'Order cancelled successfully' });
        });
      });
    }
  );
});

// COPY ITEMS FROM ORDER TO CART
app.post('/order/:orderId/copy-to-cart', (req, res) => {
  const { orderId } = req.params;
  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ success: false, message: 'Missing customerId.' });
  }

  db.get(
    "SELECT id FROM orders WHERE id = ? AND customer_id = ?",
    [orderId, customerId],
    (err, orderRow) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!orderRow) return res.status(403).json({ message: 'Order not found' });

      db.get(
        "SELECT id FROM orders WHERE customer_id = ? AND status = 'active'",
        [customerId],
        (err, activeOrder) => {
          if (err) return res.status(500).json({ message: err.message });
          
          let activeOrderId;
          if (activeOrder) {
            activeOrderId = activeOrder.id;
            copyItems(activeOrderId);
          } else {
            db.run(
              "INSERT INTO orders (customer_id, status) VALUES (?, 'active')",
              [customerId],
              function(err) {
                if (err) return res.status(500).json({ message: err.message });
                activeOrderId = this.lastID;
                copyItems(activeOrderId);
              }
            );
          }
        }
      );
    }
  );

  function copyItems(activeOrderId) {
    db.all(
      "SELECT product_id, no_items FROM cart WHERE order_id = ?",
      [orderId],
      (err, items) => {
        if (err) return res.status(500).json({ message: err.message });
        
        if (!items.length) {
          return res.status(404).json({ message: 'No items in order to copy' });
        }

        db.run(
          "DELETE FROM cart WHERE order_id = ?",
          [activeOrderId],
          function(err) {
            if (err) return res.status(500).json({ message: err.message });
            
            const placeholders = items.map(() => "(?, ?, ?)").join(", ");
            const values = items.flatMap(item => [
              activeOrderId,
              item.product_id,
              item.no_items
            ]);

            db.run(
              `INSERT INTO cart (order_id, product_id, no_items) VALUES ${placeholders}`,
              values,
              function(err) {
                if (err) return res.status(500).json({ message: err.message });
                res.json({ success: true });
              }
            );
          }
        );
      }
    );
  }
});
// ORDER HISTORY AND ORDER DETAILS SECTION END

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

app.post('/payments', authenticateToken, (req, res) => {
  const { card_no, expiry_date, cvc, name } = req.body;
  const userId = req.user.userId;

  if (!card_no || !expiry_date || !cvc || !name) {
    return res.status(400).json({ message: 'Missing required payment fields' });
  }

  db.run(
    "INSERT INTO payment (customer_id, card_no, expiry_date, cvc, name) VALUES (?, ?, ?, ?, ?)",
    [userId, card_no, expiry_date, cvc, name],
    function (err) {
      if (err) return res.status(500).json({ message: 'Database error: ' + err.message });

      res.status(201).json({ message: 'Payment method saved successfully', id: this.lastID });
    }
  );
});

// GET all payment methods for the logged-in user
app.get('/payment-methods', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all("SELECT * FROM payment WHERE customer_id = ?", [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// POST a new payment method for the logged-in user
app.post('/payments', authenticateToken, (req, res) => {
  const { card_no, expiry_date, cvc, name } = req.body;
  const customer_id = req.user.userId;

  if (!card_no || !expiry_date || !cvc || !name) {
    return res.status(400).json({ message: 'Missing card details' });
  }

  db.run(
    "INSERT INTO payment (customer_id, card_no, expiry_date, cvc, name) VALUES (?, ?, ?, ?, ?)",
    [customer_id, card_no, expiry_date, cvc, name],
    function(err) {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ message: 'Payment method saved', id: this.lastID });
    }
  );
});

// List all saved payment methods for the logged-in user
app.get('/payments', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    db.all("SELECT id, name, card_no, expiry_date FROM payment WHERE customer_id = ?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        res.json(rows);
    });
});

// Add a new payment method
app.post('/payments', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { card_no, expiry_date, cvc, name } = req.body;

    if (!card_no || !expiry_date || !cvc || !name) {
        return res.status(400).json({ message: "All fields are required." });
    }

    db.run(
        "INSERT INTO payment (customer_id, card_no, expiry_date, cvc, name) VALUES (?, ?, ?, ?, ?)",
        [userId, card_no, expiry_date, cvc, name],
        function (err) {
            if (err) return res.status(500).json({ message: 'Failed to save card', error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Edit payment method
app.put('/payments/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { card_no, expiry_date, cvc, name } = req.body;
    const paymentId = req.params.id;

    db.run(
        "UPDATE payment SET card_no = ?, expiry_date = ?, cvc = ?, name = ? WHERE id = ? AND customer_id = ?",
        [card_no, expiry_date, cvc, name, paymentId, userId],
        function (err) {
            if (err) return res.status(500).json({ message: 'Failed to update card', error: err.message });
            res.json({ message: "Card updated" });
        }
    );
});

// Delete a payment method
app.delete('/payments/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const paymentId = req.params.id;

    db.run(
        "DELETE FROM payment WHERE id = ? AND customer_id = ?",
        [paymentId, userId],
        function (err) {
            if (err) return res.status(500).json({ message: 'Failed to delete card', error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Card not found or not owned by user.' });
            }
            res.json({ message: "Card deleted" });
        }
    );
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
