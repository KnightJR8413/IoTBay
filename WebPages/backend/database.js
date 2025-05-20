const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

// Function to initialize database schema
const initializeDatabase = () => {
    // Read the schema.sql file
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    // Run the SQL commands
    db.exec(schemaSql, (err) => {
        if (err) {
            console.error('Error initializing database:', err);
        } else {
            console.log('Database initialized successfully.');
        }
    });
};

initializeDatabase(); // Call it to initialize tables

module.exports = db;

