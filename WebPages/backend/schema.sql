CREATE TABLE if NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email TEXT,
    user_type TEXT
);

CREATE TABLE if NOT EXISTS customer (
    id INTEGER PRIMARY KEY,
    phone_no VARCHAR(10),
    first_name TEXT,
    last_name TEXT,
    password_hash TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    marketing BOOLEAN DEFAULT 'off',
    FOREIGN KEY (id) REFERENCES users(id)
);

CREATE TABLE if NOT EXISTS staff (
    id INTEGER PRIMARY KEY,
    phone_no VARCHAR(10),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    password_hash TEXT,
    FOREIGN KEY (id) REFERENCES users(id)
);

CREATE TABLE if NOT EXISTS marketing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL
);

CREATE TABLE if NOT EXISTS user_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 0,
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
    product_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (product_id, tag_id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);

-- CREATE TABLE if NOT EXISTS address (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     user_id,
--     address_line_1 TEXT NOT NULL,
--     address_line_2 TEXT,
--     city TEXT NOT NULL,
--     state TEXT NOT NULL,
--     country TEXT NOT NULL,
--     postcode INTEGER NOT NULL,
--     FOREIGN KEY (user_id) REFERENCES users(id)
-- );

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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    shipping_address INTEGER,
    billing_address INTEGER,
    payment_id INTEGER,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (shipping_address) REFERENCES address(id),
    FOREIGN KEY (billing_address) REFERENCES address(id),
    FOREIGN KEY (payment_id) REFERENCES payment(id)
);

CREATE TABLE if NOT EXISTS discount_codes (
    code TEXT PRIMARY KEY NOT NULL,
    effect INTEGER NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS cart (
    cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    no_items INTEGER DEFAULT 1,
    discount_code TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (discount_code) REFERENCES discount_codes(code)
);

