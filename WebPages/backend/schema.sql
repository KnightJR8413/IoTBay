-- TODO USER LOGS
    -- CREATE TABLE, USERID, DATE, TYPE
-- TODO view registraiton details
-- TODO LIST user logs
-- TODO change registration deatils
-- TODO USER CANNOT change access logs
-- TODO cancel registeration 
    -- create endpoint that deletes selected user ID based on email or ID, add button on profile page
-- TODO USER CANNOT delete access logs 


CREATE TABLE if NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_name TEXT NOT NULL, -- temp fix
    surname TEXT NOT NULL, -- temp fix
    password_hash TEXT NOT NULL, -- temp fix
    marketing BOOLEAN DEFAULT FALSE, -- temp fix
    user_type TEXT -- NOT NULL
);

CREATE TABLE if NOT EXISTS customer (
    id INTEGER PRIMARY KEY,
    phone_no VARCHAR(10),
    first_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    marketing BOOLEAN DEFAULT FALSE,
    address_id INTEGER,
    FOREIGN KEY (id) REFERENCES users(id),
    FOREIGN KEY (address_id) REFERENCES address(id)
);

CREATE TABLE if NOT EXISTS staff (
    id INTEGER PRIMARY KEY,
    phone_no VARCHAR(10),
    first_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    FOREIGN KEY (id) REFERENCES users(id)
);

CREATE TABLE if NOT EXISTS user_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);


CREATE TABLE if NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    stock INTEGER NOT NULL,
    image_url TEXT,
    supplier TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    release_year INTEGER NOT NUll,
    specifications TEXT NOT NULL,
    size TEXT NOT NULL,
    colour TEXT
);

CREATE TABLE if NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_name TEXT NOT NULL,
    tag_desc TEXT,
    related_words TEXT
);

CREATE TABLE if NOT EXISTS product_tags (
    product_id,
    tag_id,
    PRIMARY KEY (product_id, tag_id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE if NOT EXISTS address (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_no INTEGER,
    street_no VARCHAR(8) NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    postcode INTEGER NOT NULL
);

CREATE TABLE if NOT EXISTS payment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    card_no TEXT NOT NULL, -- Symetirically encrypted
    cvc TEXT NOT NULL, -- Symetirically encrypted
    name TEXT NOT NULL,
    expiry_date TEXT NOT NULL, -- Symetirically encrypted
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);

CREATE TABLE if NOT EXISTS orders (
    id PRIMARY KEY AUTOINCREMENT,
    customer_id NOT NULL,
    shipping_address NOT NULL,
    billing address NOT NULL,
    payment_id NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (shipping_address) REFERENCES address(id),
    FOREIGN KEY (billing_address) REFERENCES address(id),
    FOREIGN KEY (payment_id) REFERENCES payment(id)
);

CREATE TABLE if NOT EXISTS discount_codes (
    code PRIMARY KEY NOT NULL,
    effect INTEGER NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE if NOT EXISTS cart (
    customer_id INTEGER NOT NULL,
    order_no INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    no_items INTEGER DEFAULT 1,
    discount_code INTEGER,
    PRIMARY KEY (customer_id, order_no, product_id),
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (order_no) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (discount_code) REFERENCES discount_codes(code)
);