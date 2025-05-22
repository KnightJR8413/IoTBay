// seed-products.js
const db = require('./database');

const products = [
  {
    name:           'Ring Camera',
    price:          64.99,
    description:    'Ring Doorbell Camera',
    stock:          12,
    image_url:      'ring-cam.png',
    supplier:       'Ring Inc.',
    brand:          'Ring',
    model:          'RBC100',
    release_year:   2024,
    specifications: '1080p, Wi-Fi, Night Vision',
    size:           '10x5x5cm',
    colour:         'Black'
  },
  {
    name:           'Infrared Sensor Light',
    price:          39.99,
    description:    'Automatically lights up!',
    stock:          20,
    image_url:      'sensor-light.png',
    supplier:       'BrightHome',
    brand:          'Infradyne',
    model:          'ISL-200',
    release_year:   2023,
    specifications: 'Motion-activated, 800 lumen',
    size:           '15x7x7cm',
    colour:         'White'
  },
  {
    name:           'Philips Purple Hue',
    price:          39.99,
    description:    'Automatically lights up!',
    stock:          20,
    image_url:      'PhilipsHue.png',
    supplier:       'Philips Inc',
    brand:          'Philips',
    model:          'PPH-200',
    release_year:   2023,
    specifications: '1000 lumen',
    size:           '15x7x7cm',
    colour:         'White'
  }
  // ← add more products here as needed
];

const sql = `
  INSERT INTO products
    (name, price, description, stock, image_url, supplier, brand, model, release_year, specifications, size, colour)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

// Use serialize to guarantee sequential execution
module.exports = function seedProducts(db) { 
  db.serialize(() => {
    products.forEach((p, idx) => {
      const params = [
        p.name, p.price, p.description, p.stock, p.image_url,
        p.supplier, p.brand, p.model, p.release_year,
        p.specifications, p.size, p.colour
      ];

      db.run(sql, params, function(err) {
        if (err) {
          console.error(`❌ [#${idx + 1}] Insert failed:`, err.message);
        } else {
          console.log(`✅ [#${idx + 1}] Inserted ID ${this.lastID}: ${p.name}`);
        }

        // After the last product, exit
        if (idx === products.length - 1) {
          console.log('All done!');
        }
      });
    });
  });
}
