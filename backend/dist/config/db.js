"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const config_1 = require("./config");
const pool = new pg_1.Pool({
    connectionString: config_1.Config.dbURI,
    ssl: {
        rejectUnauthorized: false,
    },
});
pool.connect()
    .then(() => console.log("🚀 Connected to PostgreSQL database!"))
    .catch(err => console.error("❌ Database connection error:", err));
exports.default = pool;
