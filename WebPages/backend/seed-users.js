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

const staff = [
  {
    phone_no: '1122334455',
    first_name:  "i'm not",
    last_name: "creative",
    password_hash: "$2b$10$1q88CJzz5vV3TzEzmSWZuuYbFYuMF5pjqPYGU60F042lIwEjVdXHe" //example
  },
  {
    first_name:  "Store",
    last_name: "Admin",
    password_hash: "$2b$10$m8ZKUobtZrO4Jqw87jNXF.bJ4CrPTFBBN9eqsGcy9ABXWQ5SHO72W" //admin
  }
];
const customer = {
  phone_no: '5544332211',
  first_name: "creative",
  last_name: "i'm not",
  address_line_1: "there is no checking the address here",
  address_line_2: "or here",
  password_hash: "$2b$10$1q88CJzz5vV3TzEzmSWZuuYbFYuMF5pjqPYGU60F042lIwEjVdXHe" //example
};


module.exports = function seedUsers(db) {
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Insert users and get their IDs
    const userInsert = db.prepare(`INSERT INTO users (email, user_type) VALUES (?, ?)`);

    const userIds = []; // holds auto-generated IDs

    users.forEach((user, index) => {
      userInsert.run([user.email, user.user_type], function (err) {
        if (err) return console.error("Error inserting user:", err);
        userIds[index] = this.lastID;

        // Now insert into staff or customer based on user_type
        const id = this.lastID;

        if (user.user_type === 's' || user.user_type === 'a') {
          const s = staff.shift(); // assume order matches
          db.run(
            `INSERT INTO staff (id, phone_no, first_name, last_name, password_hash) VALUES (?, ?, ?, ?, ?)`,
            [id, s.phone_no || null, s.first_name, s.last_name, s.password_hash],
            (err) => {
              if (err) console.error("Error inserting staff:", err);
            }
          );
        } else if (user.user_type === 'c') {
          db.run(
            `INSERT INTO customer (id, phone_no, first_name, last_name, password_hash, address_line_1, address_line_2) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
