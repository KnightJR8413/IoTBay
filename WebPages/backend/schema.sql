CREATE TABLE if NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    address_id INTEGER,
    first_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    password_hash TEXT NOT NULL, -- Store hashed passwords
    marketing BOOLEAN DEFAULT FALSE,
    phone_no VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (address_id) REFERENCES address(id)
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












-- CREATE TABLE orders (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     user_id INTEGER,
--     product_id INTEGER,
--     quantity INTEGER NOT NULL,
--     total_price REAL NOT NULL,
--     order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(id),
--     FOREIGN KEY (product_id) REFERENCES products(id)
-- );
