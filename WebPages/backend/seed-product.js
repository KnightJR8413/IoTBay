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
    description:    'Color-changing smart LED bulb',
    stock:          20,
    image_url:      'PhilipsHue.png',
    supplier:       'Philips Inc',
    brand:          'Philips',
    model:          'PPH-200',
    release_year:   2023,
    specifications: '1000 lumen',
    size:           '15x7x7cm',
    colour:         'White'
  },
  
  {
    name: 'Nest Learning Thermostat',
    price: 399.00,
    description: 'Smart thermostat that programs itself',
    stock: 10,
    image_url: 'NestThermo.png',
    supplier: 'Google',
    brand: 'Nest',
    model: 'T3007ES',
    release_year: 2023,
    specifications: 'Auto-schedule, remote control, energy reports',
    size: '9x9x1.3cm',
    colour: 'White'
  },
  {
    name: 'Fitbit Charge 5',
    price: 199.00,
    description: 'Advanced fitness & health tracker',
    stock: 30,
    image_url: 'Charge5.png',
    supplier: 'Fitbit',
    brand: 'Fitbit',
    model: 'Charge 5',
    release_year: 2022,
    specifications: 'Built-in GPS, ECG app, stress management',
    size: '3.1x1.8x1cm',
    colour: 'Black'
  },
  {
    name: 'DJI Mini 3 Pro',
    price: 1199.00,
    description: 'Lightweight drone with 4K video',
    stock: 7,
    image_url: 'DJIM3.png',
    supplier: 'DJI',
    brand: 'DJI',
    model: 'Mini 3 Pro',
    release_year: 2023,
    specifications: '4K/60fps, tri-directional sensors, 34 min flight time',
    size: '16x9x5cm',
    colour: 'White'
  },
  {
    name: 'August Smart Lock Pro',
    price: 402.17,
    description: 'Keyless entry deadbolt for your door',
    stock: 15,
    image_url: 'AugustSL.png',
    supplier: 'August Home',
    brand: 'August',
    model: 'Smart Lock Pro + Connect',
    release_year: 2021,
    specifications: 'Auto-lock/unlock, guest keys, Wi-Fi bridge included',
    size: '9x6x4cm',
    colour: 'White'
  },
  {
    name: 'Echo Dot (5th Gen)',
    price: 99.00,
    description: 'Compact smart speaker with Alexa',
    stock: 40,
    image_url: 'echoDot.png',
    supplier: 'Amazon',
    brand: 'Echo',
    model: 'Dot 5th Gen',
    release_year: 2022,
    specifications: 'Improved sound, temperature sensor, voice control',
    size: '10x10x8.9cm',
    colour: 'Black'
  },
  {
    name: 'MacBook Pro 14" (M2 Pro)',
    price: 2999.96,
    description: 'Apple MacBook Pro with M2 Pro chip',
    stock: 8,
    image_url: 'macP14.png',
    supplier: 'Apple',
    brand: 'Apple',
    model: 'MacBook Pro 14"',
    release_year: 2023,
    specifications: 'M2 Pro, 16-core GPU, 16GB RAM, 512GB SSD',
    size: '31.3x22.1x1.6cm',
    colour: 'Grey'
  },
  {
    name: 'Dell XPS 13',
    price: 1799.00,
    description: 'Ultra-portable Windows laptop',
    stock: 12,
    image_url: 'DellXPS13.png',
    supplier: 'Dell',
    brand: 'Dell',
    model: 'XPS 13 9315',
    release_year: 2024,
    specifications: 'Intel i7, 16GB RAM, 512GB SSD, FHD+',
    size: '29.6x19.8x1.5cm',
    colour: 'White'
  },
  {
    name: 'HP Spectre x360',
    price: 2299.00,
    description: '2-in-1 convertible laptop',
    stock: 10,
    image_url: 'HPX360.png',
    supplier: 'HP',
    brand: 'HP',
    model: 'Spectre x360 14',
    release_year: 2023,
    specifications: 'Intel i7, 16GB RAM, 1TB SSD, OLED touch',
    size: '30.4x21.7x1.7cm',
    colour: 'Black'
  },
  {
    name: 'Lenovo ThinkPad X1 Carbon',
    price: 2499.00,
    description: 'Business ultrabook, durable and light',
    stock: 5,
    image_url: 'LenovoX1.png',
    supplier: 'Lenovo',
    brand: 'Lenovo',
    model: 'X1 Carbon Gen 11',
    release_year: 2024,
    specifications: 'Intel i7, 16GB RAM, 512GB SSD, 14" 2.8K',
    size: '31.1x21.7x1.4cm',
    colour: 'Black'
  },
  {
    name: 'iPhone 15 Pro',
    price: 1849.00,
    description: 'Apple’s flagship smartphone',
    stock: 20,
    image_url: 'iphone15Pro.png',
    supplier: 'Apple',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    release_year: 2023,
    specifications: '6.1" OLED, A17 Pro, 128GB',
    size: '14.6x7.2x0.8cm',
    colour: 'Grey'
  },
  {
    name: 'Samsung Galaxy S23 Ultra',
    price: 1949.00,
    description: 'Top-end Android flagship',
    stock: 18,
    image_url: 'GalaxyS23.png',
    supplier: 'Samsung',
    brand: 'Samsung',
    model: 'Galaxy S23 Ultra',
    release_year: 2023,
    specifications: '6.8" QHD+, Snapdragon 8 Gen 2, 256GB',
    size: '16.4x7.7x0.8cm',
    colour: 'Black'
  },
  {
    name: 'Google Pixel 8',
    price: 1198.80,
    description: 'Google’s own Android phone',
    stock: 22,
    image_url: 'GooglePixel8.png',
    supplier: 'Google',
    brand: 'Google',
    model: 'Pixel 8',
    release_year: 2023,
    specifications: '6.2" OLED, Tensor G3, 128GB',
    size: '14.9x7.1x0.8cm',
    colour: 'Black'
  },
  {
    name: 'AMD Ryzen 7 9800X3D',
    price: 699.00,
    description: 'High-performance desktop processor with 3D V-Cache technology',
    stock: 15,
    image_url: 'Ryzen79800X3D.png',
    supplier: 'AMD',
    brand: 'AMD',
    model: 'Ryzen 7 9800X3D',
    release_year: 2025,
    specifications: '8-Core, 16-Thread, 3D V-Cache, AM5, 5nm',
    size: '4.0x4.0x0.6cm',
    colour: 'Silver/Orange'
  },
  {
    name: 'Ubiquiti UniFi Protect G4 PRO',
    price: 819.95,
    description: '4K Ultra HD security camera with optical zoom and IR',
    stock: 30,
    image_url: 'UniFiG4PRO.png',
    supplier: 'Ubiquiti',
    brand: 'Ubiquiti',
    model: 'UniFi Protect G4 PRO',
    release_year: 2024,
    specifications: '4K Ultra HD, 3x Optical Zoom, IR LEDs, PoE',
    size: '7.5x7.5x14.0cm',
    colour: 'White'
  },
  {
    name: 'QNAP 12+4 Bay NAS',
    price: 2949.00,
    description: 'High-capacity NAS with Intel Atom 8-Core CPU and 2.5GbE networking',
    stock: 8,
    image_url: 'QNAP12Plus4BayNAS.png',
    supplier: 'QNAP',
    brand: 'QNAP',
    model: 'TS-H1277AXU-RP',
    release_year: 2025,
    specifications: 'Atom 8-Core 2.8GHz, 8GB RAM, 2x 2.5GbE, 2x M.2, No Disks, 3YR Warranty',
    size: '48.2x42.5x8.9cm',
    colour: 'Black'
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
