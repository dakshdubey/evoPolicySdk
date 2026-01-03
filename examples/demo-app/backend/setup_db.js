const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setup() {
    console.log("🛠️ Starting MySQL Database Setup...");

    try {
        // Initial connection without database to create it
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '@nImesh12'
        });

        console.log(" Creating database if not exists...");
        await connection.query('CREATE DATABASE IF NOT EXISTS evopolicy_db');
        await connection.query('USE evopolicy_db');

        const sql = fs.readFileSync(path.join(__dirname, 'setup_mysql.sql'), 'utf-8');

        // Execute multi-statement SQL (requires a bit of splitting if not configured for it)
        // mysql2/promise execute doesn't support multiple statements by default for security.
        // We'll split by semicolon or just use a connection that allows it.

        const connectionWithMulti = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '@nImesh12',
            database: 'evopolicy_db',
            multipleStatements: true
        });

        console.log(" Executing setup_mysql.sql...");
        await connectionWithMulti.query(sql);

        console.log(" MySQL Setup Complete!");
        await connectionWithMulti.end();
        await connection.end();
        process.exit(0);

    } catch (err) {
        console.error(" Setup Failed:", err.message);
        process.exit(1);
    }
}

setup();
