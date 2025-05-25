const db = require('./database');

const users = [
  {
    email: "admin@iotbay.com",
    user_type: 'a'
  },
  {
    email: "staff@iotbay.com",
    user_type: 's'
  },
  {
    email: "customer@example.com",
    user_type: 'c'
  }
];

const staff = {
  "admin@iotbay.com": {
    phone_no: "000",
    first_name: "Store",
    last_name: "Admin",
    password_hash: "$2b$10$m8ZKUobtZrO4Jqw87jNXF.bJ4CrPTFBBN9eqsGcy9ABXWQ5SHO72W" // admin
  },
  "staff@iotbay.com": {
    phone_no: "1122334455",
    first_name: "Staff",
    last_name: "Example",
    password_hash: "$2b$10$1q88CJzz5vV3TzEzmSWZuuYbFYuMF5pjqPYGU60F042lIwEjVdXHe" // example
  }
};

const customer = {
  phone_no: '5544332211',
  first_name: "Customer",
  last_name: "Example",
  address_line_1: "there is no checking the address here",
  address_line_2: "or here",
  password_hash: "$2b$10$1q88CJzz5vV3TzEzmSWZuuYbFYuMF5pjqPYGU60F042lIwEjVdXHe" // example
};

module.exports = function seedUsers(db) {
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const userInsert = db.prepare(`INSERT INTO users (email, user_type) VALUES (?, ?)`);
    users.forEach((user) => {
      userInsert.run([user.email, user.user_type], function (err) {
        if (err) return console.error("Error inserting user:", err);
        const id = this.lastID;

        if (user.user_type === 's' || user.user_type === 'a') {
          const s = staff[user.email];
          db.run(
            `INSERT INTO staff (id, phone_no, first_name, last_name, password_hash) VALUES (?, ?, ?, ?, ?)`,
            [id, s.phone_no, s.first_name, s.last_name, s.password_hash],
            (err) => {
              if (err) console.error("Error inserting staff:", err);
            }
          );
        } else if (user.user_type === 'c') {
          db.run(
            `INSERT INTO customer (id, phone_no, first_name, last_name, password_hash, address_line_1, address_line_2)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              customer.phone_no,
              customer.first_name,
              customer.last_name,
              customer.password_hash,
              customer.address_line_1,
              customer.address_line_2
            ],
            (err) => {
              if (err) console.error("Error inserting customer:", err);
            }
          );
        }
      });
    });

    userInsert.finalize(() => {
      db.run("COMMIT");
      console.log("Data seeding completed.");
    });
  });
}